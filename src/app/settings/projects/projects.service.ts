import { computed, Injectable, resource, signal } from "@angular/core";
import { client } from "src/app/api/api";
import { getPaginationHeaders } from "src/app/shared/pagination.utils";

@Injectable()
export class SettingsProjectsService {
  orgSlug = signal<string>("");

  private projectsResource = resource({
    request: () => ({ orgSlug: this.orgSlug() }),
    loader: async ({ request }) => {
      if (!request.orgSlug) {
        return undefined;
      }
      const { data, response } = await client.GET(
        "/api/0/organizations/{organization_slug}/projects/",
        {
          params: {
            path: {
              organization_slug: request.orgSlug,
            },
          },
        },
      );
      const pagination = getPaginationHeaders(response);
      return { data, pagination };
    },
  });
  projects = computed(() => this.projectsResource.value()?.data);
}
