import {
  Component,
  ChangeDetectionStrategy,
  inject,
  input,
  OnInit,
} from "@angular/core";
import { RouterLink } from "@angular/router";
import { MatCardModule } from "@angular/material/card";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatDividerModule } from "@angular/material/divider";
import { SubscriptionService } from "src/app/api/subscriptions/subscription.service";
import { OrganizationsService } from "src/app/api/organizations.service";
import { TopAppBar } from "src/app/shared/top-app-bar/top-app-bar";
import { SubscriptionChartsComponent } from "../subscription-charts/subscription-charts.component";
import { environment } from "../../../../environments/environment";
import { SubscriptionMode } from "../subscription.component";

@Component({
  selector: "gt-self-hosted-subscription",
  templateUrl: "./self-hosted-subscription.component.html",
  styleUrls: ["./self-hosted-subscription.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TopAppBar,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    RouterLink,
    SubscriptionChartsComponent,
  ],
})
export class SelfHostedSubscriptionComponent implements OnInit {
  private subscriptionService = inject(SubscriptionService);
  private orgService = inject(OrganizationsService);

  orgSlug = input.required<string>({ alias: "org-slug" });
  mode = input.required<SubscriptionMode>();

  activeOrganization = this.orgService.activeOrganization;
  billingEmail = environment.billingEmail;

  ngOnInit(): void {
    this.subscriptionService.loadDetailData(this.orgSlug());
  }

  maskedLicenseKey(): string {
    const key = this.activeOrganization()?.licenseKey;
    if (!key || key.length < 8) return key ?? "";
    return key.substring(0, 7) + "..." + key.substring(key.length - 3);
  }
}
