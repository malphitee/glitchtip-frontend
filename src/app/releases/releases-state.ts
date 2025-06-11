import { computed, Injectable, resource, signal } from "@angular/core";
import { client, handleError, NinjaErrorResponse } from "../api/api";
import { getPaginationHeaders, getPaginator } from "../shared/pagination.utils";

@Injectable()
export class ReleasesService {
  params = signal<{ orgSlug: string; cursor: string | undefined } | undefined>(
    undefined,
  );
  #releasesResource = resource({
    params: () => ({ params: this.params() }),
    loader: async ({ params }) => {
      if (!params.params) {
        return undefined;
      }
      const { data, error, response } = await client.GET(
        "/api/0/organizations/{organization_slug}/releases/",
        {
          params: {
            path: {
              organization_slug: params.params.orgSlug,
            },
            query: {
              cursor: params.params.cursor,
            },
          },
        },
      );
      const pagination = getPaginationHeaders(response);
      let errors: NinjaErrorResponse | undefined;
      if (error) {
        errors = handleError(error, response);
      }
      return { data, errors, pagination };
    },
  });
  releases = computed(() => this.#releasesResource.value()?.data || []);
  errors = computed(() => this.#releasesResource.value()?.errors?.detail);
  pagination = computed(() => this.#releasesResource.value()?.pagination);
  paginator = computed(() => getPaginator(this.pagination()));
  isLoading = computed(() => this.#releasesResource.isLoading());
  initialLoadComplete = computed(
    () => this.#releasesResource.hasValue() || !this.isLoading(),
  );
}
