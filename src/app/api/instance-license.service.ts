import { Injectable, computed } from "@angular/core";
import { apiResource } from "../shared/api/api-resource-factory";

// Billing flow lives on hosted GlitchTip's Stripe Portal, not via the typed
// `client`. Consumers redirect the browser via `window.location.href` to
// `environment.stripePortalLoginUrl?prefilled_email=<billingEmail>`.
@Injectable({ providedIn: "root" })
export class InstanceLicenseService {
  #instanceLicenseResource = apiResource(() => ({
    url: "/api/0/instance-license/",
  }));

  licenseKey = computed(
    () => this.#instanceLicenseResource.value()?.licenseKey ?? "",
  );
  billingEmail = computed(
    () => this.#instanceLicenseResource.value()?.billingEmail ?? "",
  );
  hasLicense = computed(() => Boolean(this.licenseKey()));

  reload() {
    this.#instanceLicenseResource.reload();
  }
}
