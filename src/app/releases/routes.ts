import { Route } from "@angular/router";
import { ReleaseDetailComponent } from "./release-detail/release-detail.component";
import { Releases } from "./releases";

export default [
  {
    path: "",
    component: Releases,
  },
  {
    path: ":version",
    component: ReleaseDetailComponent,
  },
] as Route[];
