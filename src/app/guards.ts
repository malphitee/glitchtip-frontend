import { inject } from "@angular/core";
import {
  ActivatedRouteSnapshot,
  createUrlTreeFromSnapshot,
  RouterStateSnapshot,
} from "@angular/router";
import { AuthService } from "./auth.service";

export const alreadyLoggedInGuard = (next: ActivatedRouteSnapshot) => () => {
  const auth = inject(AuthService);
  if (auth.loggedInGuard()) {
    return createUrlTreeFromSnapshot(next, ["/"]);
  }
  return true;
};

export const loggedInGuard =
  (next: ActivatedRouteSnapshot, state: RouterStateSnapshot) => () => {
    const auth = inject(AuthService);
    if (auth.loggedInGuard()) {
      return true;
    }
    return createUrlTreeFromSnapshot(
      next,
      ["/", "login"],
      state.url !== "/" ? { next: state.url } : {}
    );
  };
