import { Injectable, computed, inject, resource, signal } from "@angular/core";
import { OrganizationsService } from "../../api/organizations.service";
import { client, handleError, NinjaErrorResponse } from "src/app/api/api";
import {
  getPaginationHeaders,
  getPaginator,
} from "src/app/shared/pagination.utils";

interface DataParams {
  orgSlug: string;
  cursor?: string;
  query?: string;
  start?: string;
  end?: string;
  sort?: string;
  project?: string[];
  environment?: string;
}

@Injectable()
export class PerformanceService {
  private organizationsService = inject(OrganizationsService);

  params = signal<DataParams | undefined>(undefined);
  #transactionGroupsResource = resource({
    params: () => ({ params: this.params() }),
    loader: async ({ params }) => {
      if (!params.params) {
        return undefined;
      }

      const { error, data, response } = await client.GET(
        "/api/0/organizations/{organization_slug}/transaction-groups/",
        {
          params: {
            path: { organization_slug: params.params.orgSlug },
            query: {
              cursor: params.params.cursor,
              query: params.params.query,
              start: params.params.start,
              end: params.params.end,
              sort: params.params.sort as any,
              project: params.params.project,
              environment: params.params.environment
                ? [params.params.environment]
                : undefined,
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

  transactionGroups = computed(
    () => this.#transactionGroupsResource.value()?.data || [],
  );
  transactionGroupsDisplay = computed(() => {
    const projects = this.organizationsService.activeOrganizationProjects();
    const groups = this.transactionGroups();
    return groups.map((group) => {
      const projectSlug = projects?.find(
        (project) => +project.id === (group as any).project,
      )?.name;
      return {
        ...group,
        projectSlug,
      };
    });
  });
  loading = computed(() => this.#transactionGroupsResource.isLoading());
  initialLoadComplete = computed(
    () => this.#transactionGroupsResource.hasValue() || !this.loading(),
  );
  errors = computed(
    () => this.#transactionGroupsResource.value()?.errors?.detail,
  );
  pagination = computed(
    () => this.#transactionGroupsResource.value()?.pagination,
  );
  paginator = computed(() => getPaginator(this.pagination()));
}
