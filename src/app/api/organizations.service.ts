import { computed, inject, Injectable, resource, signal } from "@angular/core";
import { client } from "./api";
import { toObservable } from "@angular/core/rxjs-interop";
import { AuthService } from "../auth.service";
import { getCursor, updateArrayById } from "../shared/pagination.utils";
import { components } from "./api-schema";

type Organization = components["schemas"]["OrganizationSchema"];

@Injectable({
  providedIn: "root",
})
export class OrganizationsService {
  authService = inject(AuthService);

  #activeOrganizationSlug = signal<string | null>(null);
  activeOrganizationSlug = computed(
    () =>
      this.#activeOrganizationSlug() ?? this.organizations()?.[0]?.slug ?? null,
  );
  organizationsResource = resource({
    params: () => ({ isAuthenticated: this.authService.isAuthenticated() }),
    loader: async ({ params, abortSignal }) => {
      if (!params.isAuthenticated) {
        return undefined;
      }
      let { data, response } = await client.GET("/api/0/organizations/", {
        signal: abortSignal,
        params: {
          query: {
            limit: 100,
          },
        },
      });
      let cursor = getCursor(response);
      if (!cursor || !data || abortSignal.aborted) {
        return data; // If one page, return early
      }

      // Get existing organizations to persist during reload
      let allAccumulatedOrgs: Organization[] = [
        ...(this.organizationsResource.value() || []),
      ];
      // Update existing organizations and add new ones
      updateArrayById(allAccumulatedOrgs, data);
      // Track all organization IDs from API to identify removed orgs later
      const loadedOrgIds = new Set<string>();
      // Add first page organization IDs
      data?.forEach((org) => loadedOrgIds.add(org.id));

      // Set causes abortSignal.aborted to be true, don't rely on it going forward
      this.organizationsResource.set(allAccumulatedOrgs);
      let i = 0;
      while (cursor && i < 10) {
        i++;
        ({ data, response } = await client.GET("/api/0/organizations/", {
          params: {
            query: {
              cursor,
              limit: 100,
            },
          },
        }));
        cursor = getCursor(response);
        if (data) {
          // Track organization IDs and update orgs from this page
          data.forEach((org) => loadedOrgIds.add(org.id));
          updateArrayById(allAccumulatedOrgs, data);
          if (cursor) {
            this.organizationsResource.set(allAccumulatedOrgs);
          }
        }
      }

      // Remove organizations that weren't found in any of the API responses
      allAccumulatedOrgs = allAccumulatedOrgs.filter((org) =>
        loadedOrgIds.has(org.id),
      );
      // Final update with removing orgs no longer present
      this.organizationsResource.set(allAccumulatedOrgs);
      return allAccumulatedOrgs;
    },
  });
  activeOrganizationResource = resource({
    params: () => ({ organization_slug: this.activeOrganizationSlug() }),
    loader: async ({ params, abortSignal }) => {
      if (!params.organization_slug) {
        return undefined;
      }
      const { data, error } = await client.GET(
        "/api/0/organizations/{organization_slug}/",
        {
          params: {
            path: { organization_slug: params.organization_slug },
          },
          signal: abortSignal,
        },
      );
      if (error) {
        throw error;
      }
      return data;
    },
  });
  organizations = computed(() => this.organizationsResource.value() || []);
  organizationsCount = computed(() => this.organizations.length);
  activeOrganization = computed(() => this.activeOrganizationResource.value());
  organizationsLoaded = computed(
    () =>
      this.organizationsResource.hasValue() ||
      !this.organizationsResource.isLoading(),
  );
  activeOrganizationLoaded = computed(
    () =>
      this.activeOrganizationResource.hasValue() ||
      !this.activeOrganizationResource.isLoading(),
  );
  activeOrganizationProjects = computed(
    () => this.activeOrganization()?.projects || [],
  );
  projectsCount = computed(() => this.activeOrganizationProjects().length);
  initialLoad = computed(
    () => this.organizationsLoaded() && this.activeOrganizationLoaded(),
  );

  // For compatibility, remove when possible
  activeOrganization$ = toObservable(this.activeOrganization);
  // activeOrganizationSlug$ = toObservable(this.activeOrganizationSlug);
  activeOrganizationProjects$ = toObservable(this.activeOrganizationProjects);

  constructor() {
    setTimeout(() => this.refresh(), 30000);
  }

  setActiveOrganizationSlug(slug: string | null) {
    this.#activeOrganizationSlug.set(slug);
  }

  refreshActiveOrganization() {
    return this.activeOrganizationResource.reload();
  }

  reload() {
    this.organizationsResource.reload();
    this.activeOrganizationResource.reload();
  }

  async createOrganization(name: string) {
    const { data, error } = await client.POST("/api/0/organizations/", {
      body: { name },
    });
    if (data) {
      this.organizationsResource.update((orgs) =>
        orgs ? [...orgs, data] : [data],
      );
    }
    return { data, error };
  }

  /**
   * Silently attempt to refresh active org details every 2 seconds
   * until event rate throttle is 0 or 12 seconds passes.
   */
  repeatRefreshOrgDetail(i = 0) {
    this.activeOrganizationResource.reload();
    const org = this.activeOrganization();
    if (
      i < 10 &&
      (org?.eventThrottleRate === undefined || org.eventThrottleRate > 0)
    ) {
      setTimeout(() => this.repeatRefreshOrgDetail(i + 1), 2000);
    }
  }

  private refresh() {
    this.activeOrganizationResource.reload();
    this.organizationsResource.reload();
    setTimeout(() => this.refresh(), 10 * 60 * 1000); // 10 min
  }
}
