import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
} from "@angular/core";
import { DatePipe } from "@angular/common";
import { MatTableModule } from "@angular/material/table";
import { MatTooltipModule } from "@angular/material/tooltip";
import { ListTitleComponent } from "../list-elements/list-title/list-title.component";
import { LogsService } from "./logs-state";
import { TopAppBar } from "../shared/top-app-bar/top-app-bar";
import { PaginationButtons } from "../list-elements/pagination-buttons/pagination-buttons";

@Component({
  templateUrl: "./logs.html",
  styleUrls: ["./logs.scss"],
  imports: [
    DatePipe,
    ListTitleComponent,
    MatTableModule,
    MatTooltipModule,
    TopAppBar,
    PaginationButtons,
  ],
  providers: [LogsService],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Logs {
  protected service = inject(LogsService);

  orgSlug = input.required<string>({ alias: "org-slug" });
  cursor = input<string | undefined>();

  paginator = this.service.paginator;
  displayedColumns = ["level", "timestamp", "service", "body"];
  logs = this.service.logs;
  errors = this.service.errors;
  isLoading = this.service.isLoading;
  initialLoadComplete = this.service.initialLoadComplete;

  constructor() {
    effect(() =>
      this.service.params.set({
        orgSlug: this.orgSlug(),
        cursor: this.cursor(),
      }),
    );
  }
}
