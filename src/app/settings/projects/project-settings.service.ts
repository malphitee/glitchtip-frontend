import { Injectable, computed, inject, resource, signal } from "@angular/core";
import { HttpErrorResponse } from "@angular/common/http";
import { MatSnackBar } from "@angular/material/snack-bar";
import {
  OrganizationProject,
  ProjectDetail,
  ProjectKey,
  ProjectNew,
} from "../../api/projects/projects-api.interfaces";
import { ProjectsAPIService } from "../../api/projects/projects-api.service";
import { ProjectKeysAPIService } from "../../api/projects/project-keys-api.service";
import { OrganizationProjectsAPIService } from "../../api/projects/organization-projects-api.service";
import { StatefulService } from "src/app/shared/stateful-service/signal-state.service";
import { client } from "src/app/api/api";
import { getPaginationHeaders } from "src/app/shared/pagination.utils";

interface ProjectLoading {
  addProjectToTeam: boolean;
  removeProjectFromTeam: string;
}

interface ProjectError {
  addProjectToTeam: string;
  removeProjectFromTeam: string;
}

interface ProjectSettingsState {
  projects: OrganizationProject[] | null;
  projectsOnTeam: OrganizationProject[];
  projectsNotOnTeam: OrganizationProject[];
  projectDetail: ProjectDetail | null;
  projectKeys: ProjectKey[] | null;
  loading: ProjectLoading;
  errors: ProjectError;
}

const initialState: ProjectSettingsState = {
  projects: null,
  projectsOnTeam: [],
  projectsNotOnTeam: [],
  projectDetail: null,
  projectKeys: null,
  loading: { addProjectToTeam: false, removeProjectFromTeam: "" },
  errors: { addProjectToTeam: "", removeProjectFromTeam: "" },
};

@Injectable({
  providedIn: "root",
})
export class ProjectSettingsService extends StatefulService<ProjectSettingsState> {
  private snackBar = inject(MatSnackBar);
  private projectsAPIService = inject(ProjectsAPIService);
  private orgProjectsAPIService = inject(OrganizationProjectsAPIService);
  private projectKeysAPIService = inject(ProjectKeysAPIService);

  private params = signal({ orgSlug: "", teamSlug: "" });
  private activeProjectSlug = signal("");
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
  private activeProjectResource = resource({
    request: () => ({
      params: this.params(),
      activeProjectSlug: this.activeProjectSlug(),
    }),
    loader: async ({ request }) => {
      if (!request.params.orgSlug || !request.activeProjectSlug) {
        return undefined;
      }
      const { data } = await client.GET(
        "/api/0/projects/{organization_slug}/{project_slug}/",
        {
          params: {
            path: {
              organization_slug: request.params.orgSlug,
              project_slug: request.activeProjectSlug,
            },
          },
        },
      );
      return data;
    },
  });
  readonly projects = computed(() => this.projectsResource.value()?.data);
  readonly activeProject = computed(() => this.activeProjectResource.value());
  readonly projectKeys = computed(() => this.state().projectKeys);
  readonly projectsOnTeam = computed(() => this.state().projectsOnTeam);
  readonly projectsNotOnTeam = computed(() => this.state().projectsNotOnTeam);
  readonly addRemoveLoading = computed(() => this.state().loading);
  readonly errors = computed(() => this.state().errors);

  constructor() {
    super(initialState);
  }

  async createProject(project: ProjectNew, teamSlug: string, orgSlug: string) {
    const { data } = await client.POST(
      "/api/0/teams/{organization_slug}/{team_slug}/projects/",
      {
        params: {
          path: {
            organization_slug: orgSlug,
            team_slug: teamSlug,
          },
        },
        body: project as any,
      },
    );
    this.addOneProject(data as any);
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
    project: number[] | null,
    activeOrgProjects: OrganizationProject[] | null,
  ) {
    if (activeOrgProjects) {
      let matchingProject: OrganizationProject | null = null;
      if (project && project.length === 1) {
        const match = activeOrgProjects.find(
          (activeOrgProject) => activeOrgProject.id === project[0],
        );
        if (match) matchingProject = match;
      } else if (activeOrgProjects.length === 1) {
        matchingProject = activeOrgProjects[0];
      }

      if (matchingProject) {
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
      this.setAddProjectToTeam(data as any);
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
      this.setRemoveProjectFromTeam(data as any);
    }
    if (error) {
      this.setRemoveProjectFromTeamLoadingError(error);
    }
  }

  retrieveProjectsOnTeam(orgSlug: string, teamSlug: string) {
    const query = `team:${teamSlug}`;
    this.orgProjectsAPIService
      .list(orgSlug, query)
      .pipe(tap((resp) => this.setProjectsPerTeam(resp)))
      .subscribe();
  }

  retrieveProjectsNotOnTeam(orgSlug: string, teamSlug: string) {
    const query = `!team:${teamSlug}`;
    return this.orgProjectsAPIService
      .list(orgSlug, query)
      .pipe(tap((resp) => this.setProjectsNotOnTeam(resp)))
      .subscribe();
  }

  retrieveProjectDetail(organizationSlug: string, projectSlug: string) {
    this.projectsAPIService
      .retrieve(organizationSlug, projectSlug)
      .pipe(tap((activeProject) => this.setActiveProject(activeProject)))
      .subscribe();
  }

  retrieveCurrentProjectClientKeys(organizationSlug: string) {
    this.activeProject$
      .pipe(
        filter((project) => !!project),
        first(),
        tap((project) => {
          return this.projectKeysAPIService
            .list(organizationSlug, project!.slug)
            .pipe(tap((projectKeys) => this.setKeys(projectKeys)))
            .subscribe();
        }),
      )
      .subscribe();
  }

  updateProjectName(orgSlug: string, projectSlug: string, projectName: string) {
    const data = { name: projectName };
    return this.projectsAPIService
      .update(orgSlug, projectSlug, data)
      .pipe(tap((resp) => this.setActiveProject(resp)));
  }

  updateProjectPlatform(
    orgSlug: string,
    projectSlug: string,
    projectPlatform: string,
    projectName: string,
  ) {
    const data = { name: projectName, platform: projectPlatform };
    return this.projectsAPIService
      .update(orgSlug, projectSlug, data)
      .pipe(tap((resp) => this.setActiveProject(resp)));
  }

  deleteProject(organizationSlug: string, projectSlug: string) {
    return this.projectsAPIService.destroy(organizationSlug, projectSlug);
  }

  private setAddProjectToTeamError(error: HttpErrorResponse) {
    const state = this.state.getValue();
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
    const state = this.state.getValue();
    this.setState({
      loading: {
        ...state.loading,
        addProjectToTeam: loading,
      },
    });
  }

  private setRemoveProjectFromTeamLoading(projectSlug: string) {
    const state = this.state.getValue();
    this.setState({
      loading: {
        ...state.loading,
        removeProjectFromTeam: projectSlug,
      },
    });
  }

  private setRemoveProjectFromTeamLoadingError(error: HttpErrorResponse) {
    const state = this.state.getValue();
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

  private setProjects(projects: OrganizationProject[]) {
    this.setState({ projects });
  }

  private setProjectsPerTeam(projectsOnTeam: OrganizationProject[]) {
    this.setState({
      projectsOnTeam,
    });
  }

  private setProjectsNotOnTeam(projectsNotOnTeam: OrganizationProject[]) {
    this.setState({
      projectsNotOnTeam,
    });
  }

  private setActiveProject(projectDetail: ProjectDetail) {
    this.setState({
      projectDetail,
    });
  }

  private addOneProject(project: OrganizationProject) {
    const newProjects = this.state.getValue().projects?.concat([project]);
    if (newProjects) {
      this.setState({
        projects: newProjects,
      });
    }
  }

  private setRemoveProjectFromTeam(project: OrganizationProject) {
    const filteredTeams = this.state
      .getValue()
      .projectsOnTeam.filter(
        (currentProject) => currentProject.slug !== project.slug,
      );
    const notOnTeam = this.state
      .getValue()
      .projectsNotOnTeam?.concat([project]);
    this.setState({
      projectsOnTeam: filteredTeams,
      projectsNotOnTeam: notOnTeam,
      loading: {
        ...this.state.getValue().loading,
        removeProjectFromTeam: "",
      },
    });
  }

  private setAddProjectToTeam(project: OrganizationProject) {
    const notOnTeam = this.state
      .getValue()
      .projectsNotOnTeam.filter(
        (currentProject) => currentProject.slug !== project.slug,
      );
    const onTeam = this.state.getValue().projectsOnTeam?.concat([project]);
    this.setState({
      projectsOnTeam: onTeam,
      projectsNotOnTeam: notOnTeam,
      loading: {
        ...this.state.getValue().loading,
        addProjectToTeam: false,
      },
    });
  }

  private setKeys(projectKeys: ProjectKey[]) {
    this.setState({ projectKeys });
  }

  clearActiveProject() {
    this.setState({ projectDetail: null, projectKeys: null });
  }
}
