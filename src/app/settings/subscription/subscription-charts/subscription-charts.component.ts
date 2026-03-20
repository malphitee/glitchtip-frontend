import {
  Component,
  ChangeDetectionStrategy,
  computed,
  inject,
  input,
} from "@angular/core";
import { DatePipe } from "@angular/common";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { SubscriptionService } from "src/app/api/subscriptions/subscription.service";
import { SummaryCardComponent } from "./summary-card/summary-card.component";

@Component({
  selector: "gt-subscription-charts",
  imports: [MatProgressSpinnerModule, SummaryCardComponent, DatePipe],
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

  loading = computed(
    () =>
      this.subscriptionService.previousPeriodResource.isLoading() ||
      this.subscriptionService.eventCountResource.isLoading(),
  );

  thisMonthPercent = computed(() => {
    const total = this.eventsCountWithTotal()?.total;
    const allowed = this.totalEventsAllowed();
    if (total == null || !allowed) return 0;
    return Math.round((total / allowed) * 100);
  });

  lastMonthPercent = computed(() => {
    const total = this.previousPeriod()?.total;
    const allowed = this.totalEventsAllowed();
    if (total == null || !allowed) return 0;
    return Math.round((total / allowed) * 100);
  });

  predictedPercent = computed(() => {
    const predicted = this.predictedTotal();
    const allowed = this.totalEventsAllowed();
    if (predicted == null || !allowed) return 0;
    return Math.round((predicted / allowed) * 100);
  });

  eventsPercent = computed(() => {
    const eventsAllowed = this.totalEventsAllowed();
    const events = this.eventsCountWithTotal();
    if (!eventsAllowed || !events) return null;
    return {
      total: (events.total / eventsAllowed) * 100,
      errorEvents: (events.eventCount! / eventsAllowed) * 100,
      transactionEvents: (events.transactionEventCount! / eventsAllowed) * 100,
      uptimeEvents: (events.uptimeCheckEventCount! / eventsAllowed) * 100,
      logEvents: (events.logEventCount! / eventsAllowed) * 100,
      fileSize: (events.fileSizeMb! / eventsAllowed) * 100,
    };
  });
}
