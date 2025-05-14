import { Injectable, computed, inject, resource, signal } from "@angular/core";
import { HttpErrorResponse } from "@angular/common/http";
import { MatSnackBar } from "@angular/material/snack-bar";
import { StatefulService } from "src/app/shared/stateful-service/signal-state.service";
import { client } from "src/app/api/api";
import { getPaginationHeaders } from "src/app/shared/pagination.utils";
import { components } from "src/app/api/api-schema";

type ProjectKey = components["schemas"]["ProjectKeySchema"];
type ProjectOrgaizationSchema =
  components["schemas"]["ProjectOrganizationSchema"];
type ProjectSchema = components["schemas"]["ProjectSchema"];

interface ProjectLoading {
  addProjectToTeam: boolean;
  removeProjectFromTeam: string;
}

interface ProjectError {
  addProjectToTeam: string;
  removeProjectFromTeam: string;
}

interface ProjectSettingsState {
  projectsOnTeam: ProjectSchema[];
  projectsNotOnTeam: ProjectSchema[];
  projectKeys: ProjectKey[] | null;
  loading: ProjectLoading;
  errors: ProjectError;
}

const initialState: ProjectSettingsState = {
  projectsOnTeam: [],
  projectsNotOnTeam: [],
  projectKeys: null,
  loading: { addProjectToTeam: false, removeProjectFromTeam: "" },
  errors: { addProjectToTeam: "", removeProjectFromTeam: "" },
};

@Injectable({
  providedIn: "root",
})
export class ProjectSettingsService extends StatefulService<ProjectSettingsState> {
  private snackBar = inject(MatSnackBar);

  private params = signal({ orgSlug: "", teamSlug: "" });
  activeProjectSlug = signal("");
  private projectsResource = resource({
    request: () => ({ params: this.params() }),
    loader: async ({ request }) => {
      if (!request.params.orgSlug || !request.params.teamSlug) {
        return undefined;
      }
      const { data, response } = await client.GET(
        "/api/0/teams/{organization_slug}/{team_slug}/projects/",
        {
          params: {
            path: {
              organization_slug: request.params.orgSlug,
              team_slug: request.params.teamSlug,
            },
          },
        },
      );
      const pagination = getPaginationHeaders(response);
      return { data, pagination };
    },
  });
  readonly projects = computed(() => this.projectsResource.value()?.data);
  readonly projectsOnTeam = computed(() => this.state().projectsOnTeam);
  readonly projectsNotOnTeam = computed(() => this.state().projectsNotOnTeam);
  readonly addRemoveLoading = computed(() => this.state().loading);
  readonly errors = computed(() => this.state().errors);

  constructor() {
    super(initialState);
  }

  /**
   * Calls retrieveProjectDetail with the active org slug and the slug of a
   * single project. Project comes from either the URL or the active org list
   *
   * @param project An array of project IDs that come from the URL
   * @param activeOrgProjects All projects associated with the active organization
   * @param orgSlug Active organization slug
   */
  getProjectDetails(
    project: string[] | null,
    activeOrgProjects: ProjectSchema[] | null,
  ) {
    if (activeOrgProjects) {
      let matchingProject: ProjectSchema | null = null;
      if (project && project.length === 1) {
        const match = activeOrgProjects.find(
          (activeOrgProject) => activeOrgProject.id === project[0],
        );
        if (match) matchingProject = match;
      } else if (activeOrgProjects.length === 1) {
        matchingProject = activeOrgProjects[0];
      }

      if (matchingProject?.slug) {
        this.activeProjectSlug.set(matchingProject.slug);
      }
    }
  }

  async addProjectToTeam(
    orgSlug: string,
    teamSlug: string,
    projectSlug: string,
  ) {
    this.setAddProjectToTeamLoading(true);
    const { data, error } = await client.POST(
      "/api/0/projects/{organization_slug}/{project_slug}/teams/{team_slug}/",
      {
        params: {
          path: {
            organization_slug: orgSlug,
            project_slug: projectSlug,
            team_slug: teamSlug,
          },
        },
      },
    );
    if (data) {
      this.snackBar.open(`${data.slug} has been added to #${teamSlug}`);
      this.setAddProjectToTeam(data);
    }
    if (error) {
      this.setAddProjectToTeamError(error);
    }
  }

  async removeProjectFromTeam(
    orgSlug: string,
    teamSlug: string,
    projectSlug: string,
  ) {
    this.setRemoveProjectFromTeamLoading(projectSlug);
    const { data, error } = await client.DELETE(
      "/api/0/projects/{organization_slug}/{project_slug}/teams/{team_slug}/",
      {
        params: {
          path: {
            organization_slug: orgSlug,
            project_slug: projectSlug,
            team_slug: teamSlug,
          },
        },
      },
    );

    if (data) {
      this.snackBar.open(`${data.slug} has been removed from #${teamSlug}`);
      this.setRemoveProjectFromTeam(data);
    }
    if (error) {
      this.setRemoveProjectFromTeamLoadingError(error);
    }
  }

  retrieveProjectsOnTeam(orgSlug: string, teamSlug: string) {
    client
      .GET("/api/0/organizations/{organization_slug}/projects/", {
        params: {
          path: {
            organization_slug: orgSlug,
          },
          query: {
            query: `team:${teamSlug}`,
          },
        },
      })
      .then(({ data }) => {
        if (data) {
          this.setProjectsPerTeam(data);
        }
      });
  }

  async retrieveProjectsNotOnTeam(orgSlug: string, teamSlug: string) {
    const { data } = await client.GET(
      "/api/0/organizations/{organization_slug}/projects/",
      {
        params: {
          path: {
            organization_slug: orgSlug,
          },
          query: {
            query: `!team:${teamSlug}`,
          },
        },
      },
    );
    if (data) {
      this.setProjectsNotOnTeam(data);
    }
  }

  setParams(orgSlug: string, teamSlug: string) {
    this.params.set({ orgSlug, teamSlug });
  }

  async updateProjectName(
    orgSlug: string,
    projectSlug: string,
    projectName: string,
  ) {
    const { data } = await client.PUT(
      "/api/0/projects/{organization_slug}/{project_slug}/",
      {
        params: {
          path: {
            organization_slug: orgSlug,
            project_slug: projectSlug,
          },
        },
        body: { name: projectName } as any,
      },
    );
    if (data) {
      this.setActiveProject(data);
    }
  }

  async updateProjectPlatform(
    orgSlug: string,
    projectSlug: string,
    projectPlatform: string,
    projectName: string,
  ) {
    const { data } = await client.PUT(
      "/api/0/projects/{organization_slug}/{project_slug}/",
      {
        params: {
          path: {
            organization_slug: orgSlug,
            project_slug: projectSlug,
          },
        },
        body: { name: projectName, platform: projectPlatform } as any,
      },
    );
    if (data) {
      this.setActiveProject(data);
    }
  }

  async deleteProject(orgSlug: string, projectSlug: string) {
    await client.DELETE("/api/0/projects/{organization_slug}/{project_slug}/", {
      params: {
        path: {
          organization_slug: orgSlug,
          project_slug: projectSlug,
        },
      },
    });
    this.projectsResource.reload();
  }

  private setAddProjectToTeamError(error: HttpErrorResponse) {
    const state = this.state();
    this.setState({
      errors: {
        ...state.errors,
        addProjectToTeam: `${error.statusText}: ${error.status}`,
      },
      loading: {
        ...state.loading,
        addProjectToTeam: false,
      },
    });
  }

  private setAddProjectToTeamLoading(loading: boolean) {
    const state = this.state();
    this.setState({
      loading: {
        ...state.loading,
        addProjectToTeam: loading,
      },
    });
  }

  private setRemoveProjectFromTeamLoading(projectSlug: string) {
    const state = this.state();
    this.setState({
      loading: {
        ...state.loading,
        removeProjectFromTeam: projectSlug,
      },
    });
  }

  private setRemoveProjectFromTeamLoadingError(error: HttpErrorResponse) {
    const state = this.state();
    this.setState({
      errors: {
        ...state.errors,
        removeProjectFromTeam: `${error.statusText}: ${error.status}`,
      },
      loading: {
        ...state.loading,
        removeProjectFromTeam: "",
      },
    });
  }

  private setProjectsPerTeam(projectsOnTeam: ProjectSchema[]) {
    this.setState({
      projectsOnTeam,
    });
  }

  private setProjectsNotOnTeam(projectsNotOnTeam: ProjectSchema[]) {
    this.setState({
      projectsNotOnTeam,
    });
  }

  private setActiveProject(projectDetail: ProjectOrgaizationSchema) {
    // this.activeProjectResource.set(projectDetail);
  }

  private setRemoveProjectFromTeam(project: ProjectSchema) {
    const filteredTeams = this.state().projectsOnTeam.filter(
      (currentProject) => currentProject.slug !== project.slug,
    );
    const notOnTeam = this.state().projectsNotOnTeam?.concat([project]);
    this.setState({
      projectsOnTeam: filteredTeams,
      projectsNotOnTeam: notOnTeam,
      loading: {
        ...this.state().loading,
        removeProjectFromTeam: "",
      },
    });
  }

  private setAddProjectToTeam(project: ProjectSchema) {
    const notOnTeam = this.state().projectsNotOnTeam.filter(
      (currentProject) => currentProject.slug !== project.slug,
    );
    const onTeam = this.state().projectsOnTeam?.concat([project]);
    this.setState({
      projectsOnTeam: onTeam,
      projectsNotOnTeam: notOnTeam,
      loading: {
        ...this.state().loading,
        addProjectToTeam: false,
      },
    });
  }

  clearActiveProject() {}
}
