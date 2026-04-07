import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
} from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";

@Component({
  selector: "gt-upgrade-banner",
  imports: [MatCardModule, MatButtonModule],
  templateUrl: "./upgrade-banner.component.html",
  styleUrls: ["./upgrade-banner.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpgradeBannerComponent {
  readonly usagePercent = input<number | null>(null);

  readonly upgradeClick = output<void>();
  readonly comparePlansClick = output<void>();

  onUpgrade() {
    this.upgradeClick.emit();
  }

  onComparePlans() {
    this.comparePlansClick.emit();
  }
}
