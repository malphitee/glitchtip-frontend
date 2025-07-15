import { Route } from "@angular/router";
import { LoginComponent } from "./login.component";
import { FinalizeLogin } from "./finalize-login";

export default [
  {
    path: "",
    pathMatch: "full",
    component: LoginComponent,
  },
  { path: ":provider", component: LoginComponent },
  { path: "finalize", component: FinalizeLogin },
] as Route[];
