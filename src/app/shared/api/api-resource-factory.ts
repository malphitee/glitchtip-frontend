import { resource, isSignal, Signal, computed, signal } from "@angular/core";
import type { FetchOptions } from "openapi-fetch";
import type { PathsWithMethod, FilterKeys } from "openapi-typescript-helpers";
import {
  getPaginationHeaders,
  getPaginator,
  PaginationState,
} from "../pagination.utils";
import { apiPaths, client, handleError, isNinjaErrorResponse } from "./api";

// #region --- Helper Types and Interfaces ---

/**
 * The standardized result for a paginated resource's value.
 */
export interface PaginatedResult<T> {
  data: T | undefined;
  pagination?: PaginationState;
}

/**
 * A TypeScript utility to infer the `data` type from a successful
 * GET operation's '200' JSON response in the OpenAPI schema.
 */
type SuccessData<TGetOperation> = TGetOperation extends {
  responses: { 200: { content: { "application/json": infer D } } };
}
  ? D
  : unknown;

// #endregion

// #region --- Core Factory Implementations ---

// Overload for static requests (no params).
function createObjectResource<TUrl extends PathsWithMethod<apiPaths, "get">>(
  getRequestOptions: () => {
    url: TUrl;
    // THE CHANGE: `options` is now optional.
    options?: FetchOptions<FilterKeys<apiPaths[TUrl], "get">>;
  },
): ReturnType<
  typeof resource<
    SuccessData<FilterKeys<apiPaths[TUrl], "get">> | undefined,
    boolean | undefined
  >
>;

// Overload for reactive requests (with params).
function createObjectResource<
  TParams,
  TUrl extends PathsWithMethod<apiPaths, "get">,
>(
  paramsSignal: Signal<TParams | undefined | null>,
  getRequestOptions: (params: TParams) => {
    url: TUrl;
    // THE CHANGE: `options` is now optional.
    options?: FetchOptions<FilterKeys<apiPaths[TUrl], "get">>;
  },
): ReturnType<
  typeof resource<
    SuccessData<FilterKeys<apiPaths[TUrl], "get">> | undefined,
    TParams | undefined
  >
>;

/**
 * The internal implementation for creating a resource for a single API object.
 * It handles both static and reactive overloads.
 * @private Not exported directly. Consumed by the public `apiResource` constant.
 */
function createObjectResource<
  TParams,
  TUrl extends PathsWithMethod<apiPaths, "get">,
>(...args: any[]) {
  const isReactive = isSignal(args[0]);
  const paramsSignal = isReactive ? args[0] : signal(true); // For static, trigger once.
  const getRequestOptions = isReactive ? args[1] : args[0];

  type TGetOperation = FilterKeys<apiPaths[TUrl], "get">;
  type TData = SuccessData<TGetOperation>;
  type TResourceParams = TParams | undefined;

  const res = resource<TData | undefined, TResourceParams>({
    params: () => {
      const p = paramsSignal();
      return p === null ? undefined : p;
    },
    loader: async ({ params, abortSignal }) => {
      if (!params) return undefined;

      const { url, options } = isReactive
        ? getRequestOptions(params)
        : getRequestOptions();
      const { data, error, response } = await client.GET(url, {
        ...options,
        signal: abortSignal,
      });

      if (error) {
        if (abortSignal.aborted) return undefined;
        throw handleError(error, response);
      }
      return data as TData;
    },
  });

  const serverError = computed(() => {
    const err = res.error();
    return isNinjaErrorResponse(err) ? err : undefined;
  });

  return Object.assign(res, { serverError });
}

/**
 * The internal implementation for creating a resource for a paginated list.
 * @private Not exported directly. Consumed by the public `apiResource` constant.
 */
function createPaginatedResource<
  TParams,
  TUrl extends PathsWithMethod<apiPaths, "get">,
>(
  paramsSignal: Signal<TParams | undefined | null>,
  getRequestOptions: (params: TParams) => {
    url: TUrl;
    options: FetchOptions<FilterKeys<apiPaths[TUrl], "get">>;
  },
) {
  type TGetOperation = FilterKeys<apiPaths[TUrl], "get">;
  type TData = SuccessData<TGetOperation>;
  type TValue = PaginatedResult<TData>;
  type TResourceParams = TParams | undefined;

  const res = resource<TValue, TResourceParams>({
    params: () => {
      const p = paramsSignal();
      return p === null ? undefined : p;
    },
    loader: async ({ params, abortSignal }) => {
      if (!params) {
        return { data: undefined, pagination: undefined };
      }

      const { url, options } = getRequestOptions(params);
      const { data, error, response } = await client.GET(url, {
        ...options,
        signal: abortSignal,
      });

      if (error) {
        if (abortSignal.aborted) {
          return { data: undefined, pagination: undefined };
        }
        throw handleError(error, response);
      }

      return {
        data: data as TData,
        pagination: getPaginationHeaders(response),
      };
    },
  });

  const paginator = computed(() => {
    const paginationState = res.value()?.pagination;
    return getPaginator(paginationState);
  });

  const serverError = computed(() => {
    const err = res.error();
    return isNinjaErrorResponse(err) ? err : undefined;
  });

  return Object.assign(res, { paginator, serverError });
}

// #endregion

// #region --- Public API Export ---

type ApiObjectResourceFn = typeof createObjectResource;

interface ApiResourceFn extends ApiObjectResourceFn {
  paginated: typeof createPaginatedResource;
}

/**
 * A namespaced set of factories for creating type-safe API resources that are
 * powered by `openapi-fetch` and integrated with Angular's signal-based
 * `resource` primitive.
 *
 * @example
 * // Static fetch for a single object, with and without options.
 * products = apiResource(() => ({ url: '/api/0/stripe/products/' }));
 * config = apiResource(() => ({ url: '/api/config/', options: {} }));
 *
 * // Reactive fetch for a single object, tied to a signal.
 * user = apiResource(this.userId, id => ({ url: '/users/{id}', options: { params: { path: { id } } } }));
 * // Access typed error: user.serverError()?.detail
 *
 * // Reactive fetch for a paginated list.
 * posts = apiResource.paginated(this.params, params => ({ url: '/posts', options: { params: { query: params } } }));
 * // Access helpers: posts.paginator() and posts.serverError()
 */
export const apiResource: ApiResourceFn = Object.assign(createObjectResource, {
  paginated: createPaginatedResource,
});

// #endregion
