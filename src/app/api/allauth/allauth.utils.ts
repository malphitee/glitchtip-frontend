import {
  ALLAUTH_SERVER_ERROR,
  ALLAUTH_UNHANDLED_ERROR,
} from "src/app/constants";
import { AllAuthError } from "./allauth.interfaces";

interface AllAuthErrorReponse {
  status: number;
  errors: AllAuthError[];
}

/**
 * Process an allauth headless api error response,
 * fetching standardized error information out of it
 */
export function handleAllAuthErrorResponse(
  err: AllAuthErrorReponse,
): AllAuthError[] {
  if (err.status === 400) {
    return err.errors;
  } else if (err.status === 500) {
    return ALLAUTH_SERVER_ERROR;
  }
  return ALLAUTH_UNHANDLED_ERROR;
}
