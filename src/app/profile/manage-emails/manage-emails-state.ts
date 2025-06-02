import { computed, Injectable, resource } from "@angular/core";
import { client } from "src/app/api/api";
import { StatefulService } from "src/app/shared/stateful-service/signal-state.service";

// type LoadingStateNames =
//   | "add"
//   | "delete"
//   | "makePrimary"
//   | "resendConfirmation";

interface LoadingStates {
  add: boolean;
  /**
   * Theoretically you could be deleting two at once and the UI won't
   * reflect this.
   */
  delete: string | null;
  /**
   * If you click one "Make primary" button and then another quickly, could
   * cause problems.
   */
  makePrimary: string | null;
  resendConfirmation: string | null;
}

interface EmailState {
  loadingStates: LoadingStates;
  addEmailError: string;
}

const initialState: EmailState = {
  loadingStates: {
    add: false,
    delete: null,
    makePrimary: null,
    resendConfirmation: null,
  },
  addEmailError: "",
};

@Injectable()
export class ManageEmailsState extends StatefulService<EmailState> {
  #emailAddressesResource = resource({
    loader: async ({ abortSignal }) => {
      const { data } = await client.GET("/api/0/users/{user_id}/emails/", {
        signal: abortSignal,
        params: {
          path: {
            user_id: "me",
          },
        },
      });
      return data;
    },
  });
  emailAddresses = computed(() => this.#emailAddressesResource.value() || []);
  emailAddressesSorted = computed(() =>
    this.emailAddresses().sort((a, b) =>
      a.isPrimary === b.isPrimary ? 0 : a.isPrimary ? -1 : 1,
    ),
  );
  loadingStates = computed(() => this.state().loadingStates);
  addEmailError = computed(() => this.state().addEmailError);

  constructor() {
    super(initialState);
  }

  async addEmailAddress(email: string) {
    const { data, error } = await client.POST(
      "/api/0/users/{user_id}/emails/",
      {
        params: {
          path: {
            user_id: "me",
          },
        },
        body: { email },
      },
    );
    if (data) {
      this.#emailAddressesResource.update((emails) =>
        emails ? emails.concat([data]) : [data],
      );
    }
    if (error) {
      console.log(error);
    }
  }

  async removeEmailAddress(email: string) {
    this.setState({
      loadingStates: { ...this.state().loadingStates, delete: email },
    });
    const { error } = await client.DELETE("/api/0/users/{user_id}/emails/", {
      params: { path: { user_id: "me" } },
      body: { email },
    });
    if (error) {
      // this.resetLoadingDelete();
      // this.setSnackbarMessage(`There was a problem. Try again later.`);
    } else {
      // this.setRemovedEmailAddress(email);
      // this.resetLoadingDelete();
      // this.#matSnackBar.open(`${email} has been removed from your account.`);
    }
  }
  makeEmailPrimary(email: string) {}
  resendConfirmation(email: string) {}
}
