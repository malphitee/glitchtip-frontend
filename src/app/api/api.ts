import createClient, {
  type ClientOptions,
  type Middleware,
} from "openapi-fetch";
import type { paths } from "./api-schema";
import { getCSRFToken } from "../shared/shared.utils";

const csrfMiddleware: Middleware = {
  async onRequest({ request }) {
    if (["DELETE", "POST", "PUT", "PATCH"].includes(request.method)) {
      request.headers.set("X-CSRFToken", getCSRFToken()!);
    }
    return request;
  },
};

let baseUrl = document.body.dataset.baseUrl;
const options: ClientOptions = {};
if (baseUrl && baseUrl !== "{{base_path}}") {
  baseUrl = baseUrl.startsWith("/") ? baseUrl : "/" + baseUrl;
  options["baseUrl"] = baseUrl;
}

export const client = createClient<paths>(options);
client.use(csrfMiddleware);
