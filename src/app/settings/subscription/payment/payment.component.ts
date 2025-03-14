import { Component, ChangeDetectionStrategy, OnInit, inject } from "@angular/core";
import { environment } from "../../../../environments/environment";
import { EventInfoComponent } from "../../../shared/event-info/event-info.component";
import { MatDividerModule } from "@angular/material/divider";
import { LoadingButtonComponent } from "../../../shared/loading-button/loading-button.component";
import { MatIconModule } from "@angular/material/icon";
import { MatCardModule } from "@angular/material/card";
import { DecimalPipe } from "@angular/common";
import { PaymentService, Price } from "./payment.service";
import { OrganizationsService } from "src/app/api/organizations.service";

@Component({
  selector: "gt-payment",
  templateUrl: "./payment.component.html",
  styleUrls: ["./payment.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCardModule,
    MatIconModule,
    LoadingButtonComponent,
    MatDividerModule,
    EventInfoComponent,
    DecimalPipe,
  ],
})
export class PaymentComponent implements OnInit {
  private organizationService = inject(OrganizationsService);
  private paymentService = inject(PaymentService);

  products = this.paymentService.products;
  subscriptionCreationLoadingId =
    this.paymentService.subscriptionCreationLoadingId;
  billingEmail = environment.billingEmail;

  ngOnInit() {
    this.organizationService.activeOrganizationResource.reload();
  }

  onSubmit(price: Price) {
    const activeOrganization = this.organizationService.activeOrganization();
    if (activeOrganization) {
      this.paymentService.dispatchSubscriptionCreation(
        activeOrganization,
        price
      );
    }
  }
}
