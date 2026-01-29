import { computed, Injectable, signal } from "@angular/core";
import { apiResource } from "../shared/api/api-resource-factory";

export interface LogsParams {
  orgSlug: string;
  cursor?: string;
  level?: string[];
  service?: string;
  query?: string;
  project?: string[];
  start?: string;
  end?: string;
}

@Injectable()
export class LogsService {
  params = signal<LogsParams | undefined>(undefined);

  #logsResource = apiResource(this.params, (params) => ({
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
          project: params.project?.map(Number),
          start: params.start,
          end: params.end,
        },
      },
    },
  }));

  // Services list for filter dropdown
  #servicesParams = computed(() => {
    const params = this.params();
    return params?.orgSlug ? { orgSlug: params.orgSlug } : undefined;
  });

  #servicesResource = apiResource(this.#servicesParams, (params) => ({
    url: "/api/0/organizations/{organization_slug}/logs/services/",
    options: {
      params: {
        path: {
          organization_slug: params.orgSlug,
        },
      },
    },
  }));

  logs = computed(() => this.#logsResource.value() || []);
  errors = computed(() => this.#logsResource.serverError()?.detail);
  isLoading = computed(() => this.#logsResource.isLoading());
  initialLoadComplete = computed(
    () => this.#logsResource.hasValue() || !this.isLoading(),
  );

  services = computed(() => this.#servicesResource.value() || []);
  servicesLoading = computed(() => this.#servicesResource.isLoading());
}
