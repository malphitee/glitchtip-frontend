import { inject, Injectable, resource, signal } from "@angular/core";
import { OrganizationsService } from "./organizations.service";
import { client } from "./api";

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
      let { data } = await client.GET(
        "/api/0/organizations/{organization_slug}/environments/",
        {
          signal: abortSignal,
          params: {
            path: { organization_slug: request.orgSlug },
            query: { limit: 100 },
          },
        },
      );
      // Add loading >100
      return data;
    },
  });

  refresh() {
    this.load.set(true);
    this.#environmentsResource.reload();
  }
}
