import { Component, ChangeDetectionStrategy, input } from "@angular/core";
import { MatCardModule } from "@angular/material/card";
import { MatProgressBarModule } from "@angular/material/progress-bar";

@Component({
  selector: "gt-summary-card",
  imports: [MatCardModule, MatProgressBarModule],
  templateUrl: "./summary-card.component.html",
  styleUrls: ["./summary-card.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SummaryCardComponent {
  title = input.required<string>();
  value = input.required<string>();
  subtitle = input.required<string>();
  percent = input.required<number>();
  isOverLimit = input(false);
}
