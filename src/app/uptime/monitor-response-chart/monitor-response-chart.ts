import {
  Component,
  Input,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  inject,
  ChangeDetectorRef,
} from "@angular/core";
import { ResponseTimeSeries } from "../uptime.interfaces";
import { NgxChartsModule } from "@swimlane/ngx-charts";

@Component({
  selector: "gt-monitor-response-chart",
  templateUrl: "./monitor-response-chart.html",
  styles: `
    .chart-container {
      height: 250px;
      width: 100%;
      float: right;
    }
  `,
  imports: [NgxChartsModule],
})
export class MonitorResponseChart implements AfterViewInit, OnDestroy {
  private changeDetector = inject(ChangeDetectorRef);

  // Manages observation of the chart's container element for size changes.
  private resizeObserver?: ResizeObserver;

  @Input() data?: ResponseTimeSeries[] | null;
  @Input() scale?: {
    yScaleMin: number;
    yScaleMax: number;
    xScaleMin: Date;
  };

  @ViewChild("containerRef") containerRef!: ElementRef<HTMLDivElement>;

  view: [number, number] = [0, 250];
  customColors = [
    { name: "Up", value: "#54a65a" },
    { name: "Down", value: "#e22a46" },
  ];

  ngAfterViewInit(): void {
    // After the view initializes, the container element is available in the DOM.
    // We instantiate and attach the ResizeObserver here to monitor it.
    this.resizeObserver = new ResizeObserver((entries) => {
      // This callback fires when the observed element's size changes.
      // It provides an array of entries; we only need the first for our container.
      const entry = entries[0];
      const { width } = entry.contentRect;
      this.view = [width, 250];

      // In a zoneless application, asynchronous callbacks from browser APIs like
      // ResizeObserver do not automatically trigger change detection. We must
      // explicitly tell Angular to update the view with the new dimensions.
      this.changeDetector.detectChanges();
    });

    this.resizeObserver.observe(this.containerRef.nativeElement);
  }

  ngOnDestroy(): void {
    // To prevent memory leaks, it is crucial to disconnect the observer
    // when the component is destroyed, stopping it from watching the element.
    this.resizeObserver?.disconnect();
  }
}
