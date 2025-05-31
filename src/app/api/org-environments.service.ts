import { computed, inject, Injectable, resource } from "@angular/core";
import { OrganizationsService } from "./organizations.service";
import { client } from "./api";
import { getCursor } from "../shared/pagination.utils";

@Injectable({
  providedIn: "root",
})
export class OrganizationEnvironmentsService {
  #orgService = inject(OrganizationsService);
  #environmentsResource = resource({
    params: () => ({
      orgSlug: this.#orgService.activeOrganizationSlug(),
    }),
    loader: async ({ params, abortSignal }) => {
      if (!params.orgSlug) {
        return undefined;
      }
      let { data, response } = await client.GET(
        "/api/0/organizations/{organization_slug}/environments/",
        {
          signal: abortSignal,
          params: {
            path: { organization_slug: params.orgSlug },
            query: { limit: 200 },
          },
        },
      );
      let cursor = getCursor(response);
      const page1 = data;
      if (cursor && page1 && !abortSignal.aborted) {
        // Support up to 400 environments
        ({ data, response } = await client.GET(
          "/api/0/organizations/{organization_slug}/environments/",
          {
            signal: abortSignal,
            params: {
              path: { organization_slug: params.orgSlug },
              query: { limit: 200, cursor },
            },
          },
        ));
        if (data) {
          return page1.concat(data);
        }
      }
      return page1;
    },
  });
  loading = computed(() => this.#environmentsResource.isLoading());
  orgEnvironments = computed(() => this.#environmentsResource.value() || []);
  orgEnvironmentNames = computed(() =>
    this.orgEnvironments().map((env) => env.name),
  );

  reload() {
    this.#environmentsResource.reload();
  }
}
