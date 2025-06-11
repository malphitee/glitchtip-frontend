import { computed, Signal } from "@angular/core";
import { getPaginator } from "src/app/shared/pagination.utils";
import type { PaginationState } from "../pagination.utils";
import { PaginatedResult } from "./api-resource-factory";

/**
 * Defines the essential shape of a resource object that PaginatedViewModel can work with.
 * This makes our view model compatible with the `ResourceRef` returned by the resource() primitive.
 */
export interface ResourceLike<T> {
  value: Signal<T | undefined>;
  isLoading: Signal<boolean>;
  hasValue: Signal<boolean>;
}

/**
 * A view model that wraps a paginated resource to provide convenient,
 * derived signals for UI consumption (e.g., data array, loading state, pagination controls).
 */
export class PaginatedViewModel<T> {
  // The raw data from the resource's `value()`
  private readonly result: Signal<PaginatedResult<T[]> | undefined>;

  // Cleaned-up computed properties for easy consumption in templates and components
  public readonly data: Signal<T[]>;
  public readonly errors: Signal<any | undefined>;
  public readonly pagination: Signal<PaginationState | undefined>;
  public readonly paginator: Signal<ReturnType<typeof getPaginator>>;
  public readonly isLoading: Signal<boolean>;
  public readonly initialLoadComplete: Signal<boolean>;

  /**
   * @param resource The resource object returned from `apiResource.paginated()`.
   */
  constructor(resource: ResourceLike<PaginatedResult<T[]>>) {
    this.result = resource.value;
    this.isLoading = resource.isLoading;

    this.data = computed(() => this.result()?.data || []);
    this.errors = computed(() => this.result()?.errors);
    this.pagination = computed(() => this.result()?.pagination);
    this.paginator = computed(() => getPaginator(this.pagination()));

    // The initial load is complete if the resource has ever received a value,
    // or if it has finished its first loading attempt (even if it resulted in an error).
    this.initialLoadComplete = computed(
      // THE FIX: Call hasValue as a method.
      () => resource.hasValue() || !this.isLoading(),
    );
  }
}
