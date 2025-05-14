import { computed, Injectable, resource, signal } from "@angular/core";
import { client } from "src/app/api/api";

@Injectable()
export class ProjectDetailService {
  #params = signal({ orgSlug: "", projectSlug: "" });
  #projectKeysResource = resource({
    request: () => ({
      params: this.#params(),
    }),
    loader: async ({ request }) => {
      if (request.params.orgSlug) {
        const { data } = await client.GET(
          "/api/0/projects/{organization_slug}/{project_slug}/keys/",
          {
            params: {
              path: {
                organization_slug: request.params.orgSlug,
                project_slug: request.params.projectSlug,
              },
            },
          },
        );
        return data;
      }
      return undefined;
    },
  });
  #projectResource = resource({
    request: () => ({
      params: this.#params(),
    }),
    loader: async ({ request }) => {
      if (!request.params.orgSlug) {
        return undefined;
      }
      const { data } = await client.GET(
        "/api/0/projects/{organization_slug}/{project_slug}/",
        {
          params: {
            path: {
              organization_slug: request.params.orgSlug,
              project_slug: request.params.projectSlug,
            },
          },
        },
      );
      return data;
    },
  });
  readonly projectKeys = computed(() => this.#projectKeysResource.value());
  readonly project = computed(() => this.#projectResource.value());

  setParams(orgSlug: string, projectSlug: string) {
    this.#params.set({ orgSlug, projectSlug });
  }
}
