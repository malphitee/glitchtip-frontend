import { Injectable, computed, resource, signal } from "@angular/core";
import { client, handleError, NinjaErrorResponse } from "src/app/api/api";
import {
  getPaginationHeaders,
  getPaginator,
} from "src/app/shared/pagination.utils";

@Injectable()
export class ReleaseDetailService {
  params = signal<{ orgSlug: string; version: string } | undefined>(undefined);
  #releaseResource = resource({
    params: () => ({ params: this.params() }),
    loader: async ({ params }) => {
      if (!params.params) {
        return undefined;
      }
      const { data } = await client.GET(
        "/api/0/organizations/{organization_slug}/releases/{version}/",
        {
          params: {
            path: {
              organization_slug: params.params.orgSlug,
              version: params.params.version,
            },
          },
        },
      );
      return data;
    },
  });
  #releaseFilesResource = resource({
    params: () => ({ params: this.params() }),
    loader: async ({ params }) => {
      if (!params.params) {
        return undefined;
      }
      const { data, error, response } = await client.GET(
        "/api/0/organizations/{organization_slug}/releases/{version}/files/",
        {
          params: {
            path: {
              organization_slug: params.params.orgSlug,
              version: params.params.version,
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
  release = computed(() => this.#releaseResource.value());
  releaseFiles = computed(() => this.#releaseFilesResource.value()?.data || []);
  releaseFileErrors = computed(
    () => this.#releaseFilesResource.value()?.errors?.detail,
  );
  pagination = computed(() => this.#releaseFilesResource.value()?.pagination);
  paginator = computed(() => getPaginator(this.pagination()));
  loading = computed(
    () =>
      this.#releaseFilesResource.isLoading() ||
      this.#releaseResource.isLoading(),
  );
  initialLoadComplete = computed(
    () =>
      (this.#releaseFilesResource.hasValue() &&
        this.#releaseResource.hasValue()) ||
      !this.loading(),
  );
}
