import { Component, OnInit, computed, inject, input, signal } from "@angular/core";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { MatIconModule } from "@angular/material/icon";
import { MatCardModule } from "@angular/material/card";
import { MatTableModule } from "@angular/material/table";
import { MatSortModule, Sort } from "@angular/material/sort";
import { DetailHeaderComponent } from "src/app/shared/detail/header/header.component";
import { TransactionGroupDetailService } from "./transaction-group-detail-state";
import { HumanizeDurationPipe } from "../../shared/seconds-or-ms.pipe";
import { OrganizationsService } from "src/app/api/organizations.service";
import { BackLinkComponent } from "src/app/shared/detail/back-link/back-link.component";
import { TopAppBar } from "src/app/shared/top-app-bar/top-app-bar";

type SpanSortKey = "totalTime" | "avgDuration" | "p95Duration" | "count";

@Component({
  selector: "gt-transaction-group-detail",
  templateUrl: "./transaction-group-detail.html",
  styleUrls: ["./transaction-group-detail.scss"],
  imports: [
    MatCardModule,
    MatTableModule,
    MatSortModule,
    RouterLink,
    MatIconModule,
    TopAppBar,
    BackLinkComponent,
    HumanizeDurationPipe,
    DetailHeaderComponent,
  ],
  providers: [TransactionGroupDetailService],
})
export class TransactionGroupDetail implements OnInit {
  private route = inject(ActivatedRoute);
  private organizationsService = inject(OrganizationsService);
  private transactionGroupDetailService = inject(TransactionGroupDetailService);

  orgSlug = input.required<string>({ alias: "org-slug" });
  id = input.required<number>({ alias: "transaction-group-id" });
  activeOrganizationSlug = this.organizationsService.activeOrganizationSlug;
  organization = this.organizationsService.activeOrganization;
  initialLoadComplete = this.transactionGroupDetailService.initialLoadComplete;
  transactionGroup = this.transactionGroupDetailService.transactionGroup;
  spansLoading = this.transactionGroupDetailService.spansLoading;

  spanColumns = ["op", "description", "count", "avgDuration", "p95Duration", "totalTime"];

  #sort = signal<{ active: SpanSortKey; direction: "asc" | "desc" }>({
    active: "totalTime",
    direction: "desc",
  });

  sortedSpans = computed(() => {
    const spans = this.transactionGroupDetailService.spans();
    if (!spans) return spans;
    const { active, direction } = this.#sort();
    const mult = direction === "asc" ? 1 : -1;
    return [...spans].sort((a, b) => (a[active] - b[active]) * mult);
  });

  ngOnInit() {
    this.transactionGroupDetailService.setParams(this.orgSlug(), this.id());
  }

  onSortChange(event: Sort) {
    if (!event.direction) {
      this.#sort.set({ active: "totalTime", direction: "desc" });
      return;
    }
    this.#sort.set({
      active: event.active as SpanSortKey,
      direction: event.direction,
    });
  }

  generateBackLink(projectId: string) {
    return {
      ...this.route.snapshot.queryParams,
      project: projectId,
    };
  }
}
