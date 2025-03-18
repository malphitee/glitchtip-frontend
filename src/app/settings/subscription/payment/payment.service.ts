import { computed, Injectable, inject, resource } from "@angular/core";
// import { MatSnackBar } from "@angular/material/snack-bar";
// import { Router } from "@angular/router";
// import { catchError, EMPTY, lastValueFrom, tap } from "rxjs";
// import { SubscriptionsAPIService } from "src/app/api/subscriptions/subscriptions-api.service";
import { StatefulService } from "src/app/shared/stateful-service/signal-state.service";
import { SettingsService } from "src/app/api/settings.service";
// import { SubscriptionsService } from "src/app/api/subscriptions/subscriptions.service";
// import { StripeService } from "../stripe.service";
import { client } from "src/app/api/api";

import { components } from "src/app/api/api-schema";
import { loadStripe } from "@stripe/stripe-js";

type Organization = components["schemas"]["OrganizationDetailSchema"];
export interface Price
  extends Omit<components["schemas"]["StripeNestedPriceSchema"], "price"> {
  price: number;
}

interface BillingState {
  subscriptionCreationLoadingId: string | null;
}

const initialState: BillingState = {
  subscriptionCreationLoadingId: null,
};

@Injectable({
  providedIn: "root",
})
export class PaymentService extends StatefulService<BillingState> {
  // private subscriptionsService = inject(SubscriptionsService);
  // private subscriptionsAPIService = inject(SubscriptionsAPIService);
  private settingsService = inject(SettingsService);
  // private stripe = inject(StripeService);
  // private snackBar = inject(MatSnackBar);
  // private router = inject(Router);

  stripePublicKey = this.settingsService.stripePublicKey;
  readonly subscriptionCreationLoadingId = computed(
    () => this.state().subscriptionCreationLoadingId
  );

  productsResource = resource({
    loader: async () => {
      const { data } = await client.GET("/api/0/stripe/products/");
      return data;
    },
  });
  products = computed(
    () =>
      this.productsResource
        .value()
        ?.map((product) => ({
          ...product,
          defaultPrice: {
            ...product.defaultPrice,
            price: parseFloat(product.defaultPrice.price),
          },
          name: product.name.startsWith("GlitchTip ")
            ? product.name.slice(10)
            : product.name,
        }))
        .sort(
          (a, b) => (a.defaultPrice.price || 0) - (b.defaultPrice.price || 0)
        ) || []
  );

  constructor() {
    super(initialState);
  }

  // dispatchSubscriptionCreation(organization: Organization, price: Price) {
  //   this.setSubscriptionCreationStart(price.stripeID);
  //   if (price.price === 0) {
  //     lastValueFrom(
  //       this.subscriptionsAPIService.create(organization.id, price.id).pipe(
  //         tap((resp) => {
  //           this.subscriptionsService.setSubscription(resp.subscription);
  //           this.router.navigate([organization.slug, "issues"]);
  //         }),
  //         catchError((err) => {
  //           if (err.status === 409) {
  //             this.setSubscriptionCreationError();
  //             this.snackBar.open(
  //               "This organization already has a subscription. Please reload page for latest details."
  //             );
  //           }
  //           return EMPTY;
  //         })
  //       ),
  //       { defaultValue: null }
  //     );
  //   } else {
  //     this.stripe.redirectToSubscriptionCheckout(organization.slug, price.id);
  //   }
  // }

  dispatchSubscriptionCreation(organization: Organization, price: Price) {
    this.setSubscriptionCreationStart(price.stripeID);
    if (price.price === 0) {
      this.createFreeSubscription(organization.id, price.stripeID);
    } else {
      this.redirectToSubscriptionCheckout(organization.slug, price.stripeID);
    }
  }

  private async createFreeSubscription(orgId: string, priceId: string) {
    const { data, error } = await client.POST("/api/0/stripe/subscriptions/", {
      body: { organization: orgId, price: priceId },
    });
    if (error) {
      console.log(error);
      // if (error. === 409) {
      //   this.setSubscriptionCreationError();
      //   this.snackBar.open(
      //     "This organization already has a subscription. Please reload page for latest details."
      //   );
      throw error;
    }
    return data;
  }

  private async redirectToSubscriptionCheckout(
    orgSlug: string,
    priceId: string
  ) {
    const stripePublicKey = this.stripePublicKey();
    const { data, error } = await client.POST(
      "/api/0/stripe/organizations/{organization_slug}/create-stripe-subscription-checkout/",
      {
        params: { path: { organization_slug: orgSlug } },
        body: { price: priceId },
      }
    );
    if (error) {
      console.log(error);
      throw error;
    }
    if (stripePublicKey) {
      return loadStripe(stripePublicKey).then((stripe) =>
        stripe?.redirectToCheckout({ sessionId: data.id })
      );
    }
    return null;
  }

  private setSubscriptionCreationStart(subscriptionCreationLoadingId: string) {
    this.setState({ subscriptionCreationLoadingId });
  }

  // private setSubscriptionCreationError() {
  //   this.setState({ subscriptionCreationLoadingId: null });
  // }
}
