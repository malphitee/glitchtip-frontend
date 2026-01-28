import { computed, Injectable, signal } from "@angular/core";
import { apiResource } from "../shared/api/api-resource-factory";

export interface LogsParams {
  orgSlug: string;
  cursor?: string;
  level?: string[];
  service?: string;
  query?: string;
}

@Injectable()
export class LogsService {
  params = signal<LogsParams | undefined>(undefined);

  #logsResource = apiResource.paginated(this.params, (params) => ({
    url: "/api/0/organizations/{organization_slug}/logs/",
    options: {
      params: {
        path: {
          organization_slug: params.orgSlug,
        },
        query: {
          cursor: params.cursor,
          level: params.level,
          service: params.service,
          query: params.query,
        },
      },
    },
  }));

  logs = computed(() => this.#logsResource.value()?.data || []);
  errors = computed(() => this.#logsResource.serverError()?.detail);
  paginator = computed(() => this.#logsResource.paginator());
  isLoading = computed(() => this.#logsResource.isLoading());
  initialLoadComplete = computed(
    () => this.#logsResource.hasValue() || !this.isLoading(),
  );
}
