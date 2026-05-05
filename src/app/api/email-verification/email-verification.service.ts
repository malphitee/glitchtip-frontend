import { computed, inject, Injectable } from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";
import { client, handleError } from "src/app/shared/api/api";
import { apiResource } from "src/app/shared/api/api-resource-factory";
import { StatefulService } from "src/app/shared/stateful-service/signal-state.service";

interface EmailVerificationState {
  resending: boolean;
}

const initialState: EmailVerificationState = {
  resending: false,
};

@Injectable({ providedIn: "root" })
export class EmailVerificationService extends StatefulService<EmailVerificationState> {
  readonly #snackBar = inject(MatSnackBar);

  #emailsResource = apiResource(() => ({
    url: "/api/0/users/{user_id}/emails/",
    options: { params: { path: { user_id: "me" } } },
  }));

  primaryEmail = computed(
    () => this.#emailsResource.value()?.find((e) => e.isPrimary)?.email,
  );

  isVerified = computed(() => {
    const emails = this.#emailsResource.value();
    if (!emails) return undefined;
    return emails.find((e) => e.isPrimary)?.isVerified ?? false;
  });

  resending = computed(() => this.state().resending);

  constructor() {
    super(initialState);
  }

  async resendVerification() {
    const email = this.primaryEmail();
    if (!email || this.resending()) return;
    this.setState({ resending: true });
    const { error, response } = await client.POST(
      "/api/0/users/{user_id}/emails/confirm/",
      {
        params: { path: { user_id: "me" } },
        body: { email },
      },
    );
    this.setState({ resending: false });
    if (response.ok) {
      this.#snackBar.open(
        $localize`A verification email has been sent to ${email}.`,
      );
      return;
    }
    const errors = handleError(error, response);
    this.#snackBar.open(
      errors.detail[0]?.msg ||
        $localize`Could not resend verification email. Please try again.`,
    );
  }

  refresh() {
    this.#emailsResource.reload();
  }
}
