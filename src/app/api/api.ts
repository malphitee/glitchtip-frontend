import createClient, {
  type ClientOptions,
  type Middleware,
} from "openapi-fetch";
import type { paths } from "./api-schema";
import type { paths as allauthPaths } from "./allauth-schema";
import { getCSRFToken } from "../shared/shared.utils";
import { SERVER_ERROR, UNHANDLED_ERROR } from "../constants";

/** Represents structured django-ninja error raised from Pydantic validation */
interface UnprocessableEntityDetail {
  type: string;
  loc: (string | number)[];
  msg: string;
  ctx?: { [key: string]: any };
}

/** Represents more generic error raised from django-ninja ValidationError List[DictStrAny] */
type GenericErrorDetailItem = Record<string, any>;

export interface NinjaErrorResponse {
  detail: UnprocessableEntityDetail[] | GenericErrorDetailItem[];
}

function isNinjaErrorResponse(payload: any): payload is NinjaErrorResponse {
  if (typeof payload !== "object" || payload === null || !payload.detail) {
    return false;
  }
  if (!Array.isArray(payload.detail)) {
    return false;
  }
  return true;
}

export function handleError(
  error: any,
  response: Response,
): NinjaErrorResponse {
  if (response.status === 500) {
    return { detail: [{ 500: SERVER_ERROR }] };
  } else if (response.status === 422 && isNinjaErrorResponse(error)) {
    return error;
  }
  return { detail: [{ unhandled: UNHANDLED_ERROR }] };
}

const csrfMiddleware: Middleware = {
  async onRequest({ request }) {
    if (["DELETE", "POST", "PUT", "PATCH"].includes(request.method)) {
      request.headers.set("X-CSRFToken", getCSRFToken()!);
    }
    return request;
  },
};

const options: ClientOptions = {};
const baseElement = document.querySelector("base");
if (baseElement) {
  const baseHref = baseElement.href;
  if (baseHref !== "/") {
    options["baseUrl"] = baseHref;
  }
}
export const client = createClient<paths & allauthPaths>(options);
client.use(csrfMiddleware);
