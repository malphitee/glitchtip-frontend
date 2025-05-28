import { inject, Injectable, resource, signal } from "@angular/core";
import { OrganizationsService } from "./organizations.service";
import { client } from "./api";
import { getCursor } from "../shared/pagination.utils";

@Injectable({
  providedIn: "root",
})
export class OrganizationEnvironmentsService {
  #orgService = inject(OrganizationsService);
  load = signal(false);
  #environmentsResource = resource({
    request: () => ({
      orgSlug: this.#orgService.activeOrganizationSlug(),
      load: this.load(),
    }),
    loader: async ({ request, abortSignal }) => {
      if (!request.orgSlug || !request.load) {
        return undefined;
      }
      let { data, response } = await client.GET(
        "/api/0/organizations/{organization_slug}/environments/",
        {
          signal: abortSignal,
          params: {
            path: { organization_slug: request.orgSlug },
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
              path: { organization_slug: request.orgSlug },
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

  refresh() {
    this.load.set(true);
    this.#environmentsResource.reload();
  }
}
