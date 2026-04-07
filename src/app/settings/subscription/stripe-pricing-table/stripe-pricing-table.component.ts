import {
  Component,
  ChangeDetectionStrategy,
  inject,
  OnInit,
  input,
  CUSTOM_ELEMENTS_SCHEMA,
} from "@angular/core";
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { SettingsService } from "src/app/api/settings.service";
import { SubscriptionService } from "src/app/api/subscriptions/subscription.service";

@Component({
  selector: "gt-stripe-pricing-table",
  standalone: true,
  templateUrl: "./stripe-pricing-table.component.html",
  styleUrls: ["./stripe-pricing-table.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
})
export class StripePricingTableComponent implements OnInit {
  readonly orgSlug = input<string>("");

  private dialogData = inject<{ orgSlug: string }>(MAT_DIALOG_DATA, {
    optional: true,
  });
  private dialogRef = inject<MatDialogRef<StripePricingTableComponent>>(
    MatDialogRef,
    { optional: true },
  );
  private settingsService = inject(SettingsService);
  private subscriptionService = inject(SubscriptionService);

  stripePublicKey = this.settingsService.stripePublicKey;
  stripePricingTableID = this.settingsService.stripePricingTableID;
  customerSessionClientSecret =
    this.subscriptionService.customerSessionClientSecret;

  isDialog = !!this.dialogRef;

  private getOrgSlug(): string {
    return this.dialogData?.orgSlug || this.orgSlug();
  }

  ngOnInit() {
    this.loadStripeScript();
    this.subscriptionService.fetchCustomerSession(this.getOrgSlug());
  }

  close() {
    this.dialogRef?.close();
  }

  private loadStripeScript() {
    if (document.querySelector('script[src*="pricing-table.js"]')) return;
    const script = document.createElement("script");
    script.src = "https://js.stripe.com/v3/pricing-table.js";
    script.async = true;
    document.head.appendChild(script);
  }
}
