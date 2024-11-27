import { inject } from "@angular/core";
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  createUrlTreeFromSnapshot,
  RouterStateSnapshot,
} from "@angular/router";
import { AuthService } from "./auth.service";

export const alreadyLoggedInGuard: CanActivateFn = (
  next: ActivatedRouteSnapshot
) => {
  const auth = inject(AuthService);
  if (auth.loggedInGuard()) {
    return createUrlTreeFromSnapshot(next, ["/"]);
  }
  return true;
};

export const loggedInGuard: CanActivateFn = (
  next: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
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
