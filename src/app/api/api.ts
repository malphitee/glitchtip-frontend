import createClient, { type Middleware } from "openapi-fetch";
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

export const client = createClient<paths>();
client.use(csrfMiddleware);
