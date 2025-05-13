import { Injectable, computed, inject, resource } from "@angular/core";
import { ProjectEnvironment } from "src/app/api/organizations/organizations.interface";
import { ProjectSettingsService } from "../../project-settings.service";
import { OrganizationsService } from "src/app/api/organizations.service";
import { StatefulService } from "src/app/shared/stateful-service/signal-state.service";
import { client } from "src/app/api/api";

interface ProjectsState {
  toggleHiddenLoading: number | null;
}

const initialState: ProjectsState = {
  toggleHiddenLoading: null,
};

@Injectable({
  providedIn: "root",
})
export class ProjectEnvironmentsService extends StatefulService<ProjectsState> {
  private organizationsService = inject(OrganizationsService);
  private projectSettingsService = inject(ProjectSettingsService);

  readonly initialLoad = computed(() => this.environmentsResource.hasValue());
  readonly toggleHiddenLoading = computed(
    () => this.state().toggleHiddenLoading,
  );
  readonly environments = computed(() => this.environmentsResource.value());
  readonly sortedEnvironments = computed(() => {
    const environments = this.environments();
    if (environments === undefined || environments.length === 0) return null;
    const visible = {
      heading: "Visible",
      environments: environments.filter(
        (environment) => environment.isHidden === false,
      ),
    };
    const hidden = {
      heading: "Hidden",
      environments: environments.filter(
        (environment) => environment.isHidden === true,
      ),
    };
    const sorted = [];
    if (visible.environments.length > 0) sorted.push(visible);
    if (hidden.environments.length > 0) sorted.push(hidden);
    return sorted;
  });
  readonly visibleEnvironments = computed(() => {
    return (
      this.environments()
        ?.filter((environment) => environment.isHidden === false)
        .map((environment) => environment.name) || []
    );
  });

  readonly visibleEnvironmentsLoaded = computed(() => {
    if (!this.initialLoad()) return [];
    return this.environments()
      ?.filter((environment) => environment.isHidden === false)
      .map((environment) => environment.name);
  });
  private environmentsResource = resource({
    request: () => ({
      orgSlug: this.organizationsService.activeOrganizationSlug(),
      projectSlug: this.projectSettingsService.activeProjectSlug(),
    }),
    loader: async ({ request }) => {
      if (!request.orgSlug || !request.projectSlug) {
        return undefined;
      }
      const { data } = await client.GET(
        "/api/0/projects/{organization_slug}/{project_slug}/environments/",
        {
          params: {
            path: {
              organization_slug: request.orgSlug,
              project_slug: request.projectSlug,
            },
          },
        },
      );
      return data;
    },
  });

  constructor() {
    super(initialState);
  }

  async updateEnvironment(environment: ProjectEnvironment) {
    const orgSlug = this.organizationsService.activeOrganizationSlug();
    const projectSlug = this.projectSettingsService.activeProjectSlug();

    if (!orgSlug || !projectSlug) {
      return;
    }

    this.setState({ toggleHiddenLoading: environment.id });

    const { data } = await client.PUT(
      "/api/0/projects/{organization_slug}/{project_slug}/environments/{name}/",
      {
        params: {
          path: {
            organization_slug: orgSlug,
            project_slug: projectSlug,
            name: environment.name,
          },
        },
        body: environment,
      },
    );
    if (data) {
      this.environmentsResource.reload();
    }
    this.setState({ toggleHiddenLoading: null });
    return data;
  }

  // Make this computed instead
  // private sortEnvironments(environments: ProjectEnvironment[]) {
  //   // https://stackoverflow.com/a/17387454/
  //   return environments.sort((a, b) =>
  //     a.isHidden === b.isHidden ? 0 : a.isHidden ? 1 : -1,
  //   );
  // }

  // private updatedEnvironments(newEnvironment: ProjectEnvironment) {
  //   const currentEnvironments = this.state().environments;
  //   const environmentToReplace = currentEnvironments.findIndex(
  //     (currentEnvironment) => currentEnvironment.name === newEnvironment.name,
  //   );
  //   currentEnvironments[environmentToReplace] = newEnvironment;
  //   return this.sortEnvironments(currentEnvironments);
  // }
}
