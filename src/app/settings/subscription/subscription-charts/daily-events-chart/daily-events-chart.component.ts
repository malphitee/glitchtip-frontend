import {
  Component,
  ChangeDetectionStrategy,
  ElementRef,
  OnDestroy,
  ViewChild,
  computed,
  input,
  signal,
} from "@angular/core";
import { BarChartModule } from "@swimlane/ngx-charts";
import { MatCardModule } from "@angular/material/card";
import { components } from "src/app/api/api-schema";

type DailyEventEntry = components["schemas"]["DailyEventCountEntry"];

@Component({
  selector: "gt-daily-events-chart",
  imports: [BarChartModule, MatCardModule],
  templateUrl: "./daily-events-chart.component.html",
  styleUrls: ["./daily-events-chart.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DailyEventsChartComponent implements OnDestroy {
  private resizeObserver?: ResizeObserver;
  private _containerRef?: ElementRef<HTMLDivElement>;

  readonly dailyEvents = input<DailyEventEntry[]>([]);
  readonly periodEnd = input<string | null>(null);
  readonly predictedTotal = input<number | null>(null);

  view = signal<[number, number]>([600, 200]);

  customColors = [
    { name: "Performance", value: "var(--mat-sys-primary)" },
    { name: "Issues", value: "var(--issues-color)" },
    { name: "Uptime", value: "var(--uptime-color)" },
    { name: "Projected", value: "var(--mat-sys-surface-container-high)" },
  ];

  /** Map from short label back to full date string for tooltip/formatting */
  private labelToDate = new Map<string, string>();

  chartData = computed(() => {
    const events = this.dailyEvents();
    const endDate = this.periodEnd();
    const predicted = this.predictedTotal();
    this.labelToDate.clear();

    const series: { name: string; series: { name: string; value: number }[] }[] = [];
    const allDates: string[] = [];

    for (const entry of events) {
      allDates.push(entry.date);
      series.push({
        name: entry.date,
        series: [
          { name: "Performance", value: entry.transactionEventCount },
          { name: "Issues", value: entry.eventCount },
          { name: "Uptime", value: entry.uptimeCheckEventCount },
        ],
      });
    }

    if (endDate && predicted !== null && events.length > 0) {
      const totalActual = events.reduce(
        (sum, e) => sum + e.eventCount + e.transactionEventCount + e.uptimeCheckEventCount,
        0,
      );
      const remaining = Math.max(0, predicted - totalActual);
      const lastDate = new Date(events[events.length - 1].date);
      const end = new Date(endDate);
      const futureDays = Math.max(
        1,
        Math.ceil((end.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)),
      );
      const dailyProjected = Math.round(remaining / futureDays);

      for (let i = 1; i <= futureDays; i++) {
        const futureDate = new Date(lastDate);
        futureDate.setDate(futureDate.getDate() + i);
        if (futureDate > end) break;
        const dateStr = futureDate.toISOString().split("T")[0];
        allDates.push(dateStr);
        series.push({
          name: dateStr,
          series: [
            { name: "Projected", value: dailyProjected },
          ],
        });
      }
    }

    // Build label map for tick formatting
    for (const dateStr of allDates) {
      const d = new Date(dateStr + "T00:00:00");
      const label = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(d);
      this.labelToDate.set(dateStr, label);
    }

    return series;
  });

  xAxisTickFormatting = (dateStr: string): string => {
    const d = new Date(dateStr + "T00:00:00");
    const day = d.getDate();
    // Show label on 1st, and every 3rd day
    if (day === 1 || day % 3 === 0) {
      return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(d);
    }
    return "";
  };

  periodRange = computed(() => {
    const events = this.dailyEvents();
    const endDate = this.periodEnd();
    if (events.length === 0) return "";
    const start = new Date(events[0].date);
    const end = endDate ? new Date(endDate) : new Date(events[events.length - 1].date);
    const fmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });
    return `${fmt.format(start)} \u2013 ${fmt.format(end)}`;
  });

  @ViewChild("containerRef")
  set containerRef(element: ElementRef<HTMLDivElement> | undefined) {
    if (element) {
      this._containerRef = element;
      this.initializeResizeObserver();
    } else if (this._containerRef) {
      this.resizeObserver?.disconnect();
      this._containerRef = undefined;
    }
  }

  private initializeResizeObserver(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      this.view.set([width, 200]);
    });
    if (this._containerRef) {
      this.resizeObserver.observe(this._containerRef.nativeElement);
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

}
