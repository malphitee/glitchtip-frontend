import { computed, Injectable, inject, resource } from "@angular/core";
import { Router } from "@angular/router";
import { lastValueFrom } from "rxjs";
import { tap } from "rxjs/operators";
import { EventsCount } from "./subscriptions.interfaces";
import { StatefulService } from "src/app/shared/stateful-service/signal-state.service";
import { SubscriptionsAPIService } from "./subscriptions-api.service";
import { client } from "../api";
import { OrganizationsService } from "../organizations.service";
import { SettingsService } from "../settings.service";

interface SubscriptionsState {
  billingPortalLoading: boolean;
  billingPortalLoadingError: string;
  subscriptionLoadingTimeout: boolean;
  fromStripe: boolean;
  eventsCount: EventsCount | null;
}

const initialState: SubscriptionsState = {
  billingPortalLoading: false,
  billingPortalLoadingError: "",
  subscriptionLoadingTimeout: false,
  fromStripe: false,
  eventsCount: null,
};

@Injectable({
  providedIn: "root",
})
export class SubscriptionsService extends StatefulService<SubscriptionsState> {
  private organizationsService = inject(OrganizationsService);
  private settingsService = inject(SettingsService);
  private subscriptionsAPIService = inject(SubscriptionsAPIService);
  private router = inject(Router);

  stripePublicKey = this.settingsService.stripePublicKey;

  subscriptionLoading = computed(() => this.subscriptionResource.isLoading());
  subscriptionLoadingTimeout = computed(
    () => this.state().subscriptionLoadingTimeout
  );
  subscriptionResource = resource({
    request: () => ({
      orgSlug: this.organizationsService.activeOrganizationSlug(),
    }),
    loader: async ({ request }) => {
      if (!request.orgSlug) {
        return undefined;
      }

      const { data, error } = await client.GET(
        "/api/0/stripe/subscriptions/{organization_slug}/",
        {
          params: {
            path: { organization_slug: request.orgSlug },
          },
        }
      );
      if (error) {
        throw error;
      }
      return data;
    },
  });
  subscription = computed(() => {
    const subscriptionResponse = this.subscriptionResource.value();
    if (!subscriptionResponse) {
      return null;
    }
    const formattedSubscription = {
      ...subscriptionResponse,
      effectivePrice: +subscriptionResponse.price.price,
    };
    return formattedSubscription;
  });

  eventCountResource = resource({
    request: () => ({
      orgSlug: this.organizationsService.activeOrganizationSlug(),
    }),
    loader: async ({ request }) => {
      if (!request.orgSlug) {
        return undefined;
      }

      const { data, error } = await client.GET(
        "/api/0/stripe/subscriptions/{organization_slug}/events_count/",
        {
          params: {
            path: { organization_slug: request.orgSlug },
          },
        }
      );
      if (error) {
        throw error;
      }
      return data;
    },
  });

  eventsCountWithTotal = computed(() => {
    const eventsCount = this.eventCountResource.value();
    if (!eventsCount) return eventsCount;

    const total =
      eventsCount.eventCount! +
      eventsCount.transactionEventCount! +
      eventsCount.uptimeCheckEventCount! +
      eventsCount.fileSizeMb!;

    return { ...eventsCount, total };
  });

  billingPortalLoading = computed(() => this.state().billingPortalLoading);
  billingPortalLoadingError = computed(
    () => this.state().billingPortalLoadingError
  );

  fromStripe = computed(() => this.state().fromStripe);
  totalEventsAllowed = computed(() => {
    const subscription = this.subscription();
    return subscription?.product.events || null;
  });

  constructor() {
    super(initialState);
  }

  /**
   * Keep trying to get subscription, for users redirected from Stripe
   * @param slug Organization Slug for requested subscription
   */
  // retrieveUntilSubscriptionOrTimeout(slug: string) {
  //   this.setSubscriptionLoadingStart(true);
  //   lastValueFrom(
  //     this.subscriptionsAPIService.retrieve(slug).pipe(
  //       expand((subscription) => {
  //         if (!subscription.created) {
  //           return this.subscriptionsAPIService
  //             .retrieve(slug)
  //             .pipe(delay(2000));
  //         } else {
  //           this.setSubscription(subscription);
  //           return EMPTY;
  //         }
  //       }),
  //       catchError(() => {
  //         this.setSubscriptionLoadingError();
  //         return EMPTY;
  //       }),
  //       takeUntil(this.subscriptionRetryTimer())
  //     ),
  //     { defaultValue: null }
  //   );
  // }

  /**
   * Retrieve Subscription and navigate to subscription page if no subscription exists
   */
  checkIfUserHasSubscription(orgSlug: string) {
    const subscriptionRoute = [orgSlug, "settings", "subscription"];
    if (
      !this.router.isActive(this.router.createUrlTree(subscriptionRoute), {
        paths: "exact",
        queryParams: "subset",
        fragment: "ignored",
        matrixParams: "ignored",
      })
    ) {
      lastValueFrom(
        this.subscriptionsAPIService.retrieve(orgSlug).pipe(
          tap((subscription) => {
            if (subscription === null) {
              this.router.navigate(subscriptionRoute);
            }
          })
        )
      );
    }
  }

  async redirectToBillingPortal() {
    this.setBillingPortalLoadingStart();
    const orgSlug = this.organizationsService.activeOrganizationSlug();
    const { data, error } = await client.POST(
      "/api/0/stripe/organizations/{organization_slug}/create-billing-portal/",
      {
        params: {
          path: { organization_slug: orgSlug },
        },
      }
    );
    if (error) {
      this.setBillingPortalLoadingError(
        "Something went wrong. Only organization owners can manage subscription settings."
      );
    }
    if (data) {
      window.location.href = data.url;
    }
  }

  // private subscriptionRetryTimer() {
  //   return timer(60000).pipe(
  //     tap(() => {
  //       this.setSubscriptionLoadingTimeout();
  //     })
  //   );
  // }

  // private setSubscriptionLoadingStart(fromStripe: boolean = false) {
  //   this.setState({ subscriptionLoading: true, fromStripe });
  // }

  // private setSubscriptionLoadingError() {
  //   this.setState({ subscriptionLoading: false });
  // }

  // private setSubscriptionLoadingTimeout() {
  //   this.setState({
  //     subscriptionLoadingTimeout: true,
  //   });
  // }

  setBillingPortalLoadingStart() {
    this.setState({ billingPortalLoading: true });
  }

  setBillingPortalLoadingError(message: string) {
    this.setState({
      billingPortalLoading: false,
      billingPortalLoadingError: message,
    });
  }
}
