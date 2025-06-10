import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from "@angular/core";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { AsyncPipe, DatePipe } from "@angular/common";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatTableModule } from "@angular/material/table";
import { checkForOverflow } from "src/app/shared/shared.utils";
import { ListTitleComponent } from "../list-elements/list-title/list-title.component";
import { ListFooterComponent } from "../list-elements/list-footer/list-footer.component";
import { ReleasesService } from "./releases.service";

@Component({
  templateUrl: "./releases.html",
  styleUrls: ["./releases.scss"],
  imports: [
    AsyncPipe,
    DatePipe,
    ListTitleComponent,
    MatTableModule,
    RouterLink,
    MatTooltipModule,
    ListFooterComponent,
  ],
  providers: [ReleasesService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Releases {
  protected service = inject(ReleasesService);
  protected route = inject(ActivatedRoute);

  orgSlug = input.required<string>({ alias: "org-slug" });
  cursor = input<string | undefined>();
  paginator$ = this.service.paginator$;
  tooltipDisabled = false;
  displayedColumns = ["version", "created"];
  releases$ = this.service.releases$;
  errors$ = this.service.errors$;
  loading$ = this.service.loading$;
  initialLoadComplete$ = this.service.initialLoadComplete$;

  constructor() {}

  ngOnInit() {
    this.service.getReleases(this.orgSlug(), this.cursor());
  }

  checkIfTooltipIsNecessary($event: Event) {
    this.tooltipDisabled = checkForOverflow($event);
  }
}
