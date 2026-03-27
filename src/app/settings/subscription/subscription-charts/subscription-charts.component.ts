import {
  Component,
  ChangeDetectionStrategy,
  computed,
  inject,
  input,
} from "@angular/core";
import { MatCardModule } from "@angular/material/card";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { SubscriptionService } from "src/app/api/subscriptions/subscription.service";
import { DailyEventsChartComponent } from "./daily-events-chart/daily-events-chart.component";
import { SummaryCardComponent } from "./summary-card/summary-card.component";

@Component({
  selector: "gt-subscription-charts",
  imports: [MatCardModule, MatProgressSpinnerModule, DailyEventsChartComponent, SummaryCardComponent],
  templateUrl: "./subscription-charts.component.html",
  styleUrls: ["./subscription-charts.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubscriptionChartsComponent {
  private subscriptionService = inject(SubscriptionService);

  totalEventsAllowed = input.required<number | null>();

  eventsCountWithTotal = this.subscriptionService.eventsCountWithTotal;
  previousPeriod = this.subscriptionService.previousPeriodEvents;
  predictedTotal = this.subscriptionService.predictedEndOfMonth;
  subscription = this.subscriptionService.subscription;
  dailyEvents = this.subscriptionService.dailyEvents;

  periodEnd = computed(() => {
    const sub = this.subscription();
    return sub?.subscriptionCycleEnd ?? sub?.currentPeriodEnd ?? null;
  });

  loading = computed(
    () =>
      this.subscriptionService.previousPeriodResource.isLoading() ||
      this.subscriptionService.eventCountResource.isLoading() ||
      this.subscriptionService.dailyEventsResource.isLoading(),
  );

  thisMonthPercent = this.subscriptionService.thisMonthPercent;

  previousPeriodTotal = computed(() => {
    const prev = this.previousPeriod();
    if (!prev) return 0;
    return prev.total ?? (prev.eventCount + prev.transactionEventCount + prev.uptimeCheckEventCount + (prev.logEventCount ?? 0) * 0.1);
  });

  lastMonthPercent = computed(() => {
    const total = this.previousPeriodTotal();
    const allowed = this.totalEventsAllowed();
    if (!allowed) return 0;
    return Math.round((total / allowed) * 100);
  });

  predictedPercent = computed(() => {
    const predicted = this.predictedTotal();
    const allowed = this.totalEventsAllowed();
    if (predicted == null || !allowed) return 0;
    return Math.round((predicted / allowed) * 100);
  });

  eventBreakdown = computed(() => {
    const events = this.eventsCountWithTotal();
    if (!events) return null;
    const total = events.total || 1;
    return {
      performance: {
        count: events.transactionEventCount ?? 0,
        percent: Math.round(((events.transactionEventCount ?? 0) / total) * 100),
      },
      issues: {
        count: events.eventCount ?? 0,
        percent: Math.round(((events.eventCount ?? 0) / total) * 100),
      },
      uptime: {
        count: events.uptimeCheckEventCount ?? 0,
        percent: Math.round(((events.uptimeCheckEventCount ?? 0) / total) * 100),
      },
      logs: {
        count: events.logEventCount ?? 0,
        percent: Math.round(((events.logEventCount ?? 0) / total) * 100),
      },
      fileSizeMb: events.fileSizeMb ?? 0,
    };
  });
}
