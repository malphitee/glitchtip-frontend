import { computed, Injectable, inject, resource, signal } from "@angular/core";
import { Router } from "@angular/router";
import { lastValueFrom } from "rxjs";
import { tap } from "rxjs/operators";
import { EventsCount } from "./subscriptions.interfaces";
import { StatefulService } from "src/app/shared/stateful-service/signal-state.service";
import { SubscriptionsAPIService } from "./subscriptions-api.service";
import { client } from "../api";
import { SettingsService } from "../settings.service";

interface SubscriptionsState {
  billingPortalLoading: boolean;
  billingPortalLoadingError: string;
  subscriptionRefreshing: boolean;
  subscriptionLoadingTimeout: boolean;
  fromStripe: boolean;
  eventsCount: EventsCount | null;
}

const initialState: SubscriptionsState = {
  billingPortalLoading: false,
  billingPortalLoadingError: "",
  subscriptionRefreshing: false,
  subscriptionLoadingTimeout: false,
  fromStripe: false,
  eventsCount: null,
};

@Injectable({
  providedIn: "root",
})
export class SubscriptionsService extends StatefulService<SubscriptionsState> {
  private settingsService = inject(SettingsService);
  private subscriptionsAPIService = inject(SubscriptionsAPIService);
  private router = inject(Router);

  stripePublicKey = this.settingsService.stripePublicKey;

  organizationSlug = signal<string>("");

  subscriptionResource = resource({
    request: () => ({
      orgSlug: this.organizationSlug(),
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
  subscriptionLoading = computed(
    () =>
      this.subscriptionResource.isLoading() ||
      this.state().subscriptionRefreshing
  );
  subscriptionLoadingTimeout = computed(
    () => this.state().subscriptionLoadingTimeout
  );

  eventCountResource = resource({
    request: () => ({
      orgSlug: this.organizationSlug(),
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

  retrieveSubscriptionData(orgSlug: string) {
    if (orgSlug) {
      this.organizationSlug.set(orgSlug);
    }
  }

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
    const orgSlug = this.organizationSlug();
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

  /**
   * Keep trying to get subscription, for users redirected from Stripe
   */
  refreshUntilSubscriptionOrTimeout() {
    this.setSubscriptionRefreshingStart(true);
    let i = 0;
    const intervalRef = setInterval(() => {
      this.subscriptionResource.reload();
      if (this.subscription()) {
        this.setSubscriptionRefreshingComplete();
        clearInterval(intervalRef);
      } else if (i === 2) {
        this.setSubscriptionRefreshingTimeout();
        clearInterval(intervalRef);
      }
      i++;
    }, 2000);
  }

  private setSubscriptionRefreshingStart(fromStripe: boolean = false) {
    this.setState({ subscriptionRefreshing: true, fromStripe });
  }

  private setSubscriptionRefreshingComplete(fromStripe: boolean = false) {
    this.setState({ subscriptionRefreshing: false });
  }

  private setSubscriptionRefreshingTimeout() {
    this.setState({
      subscriptionRefreshing: false,
      subscriptionLoadingTimeout: true,
    });
  }

  private setBillingPortalLoadingStart() {
    this.setState({ billingPortalLoading: true });
  }

  private setBillingPortalLoadingError(message: string) {
    this.setState({
      billingPortalLoading: false,
      billingPortalLoadingError: message,
    });
  }

  clearState() {
    super.clearState();
    this.organizationSlug.set("");
    this.subscriptionResource.set(undefined);
    this.eventCountResource.set(undefined);
  }
}
