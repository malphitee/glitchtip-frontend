import { Injectable, computed, inject, resource } from "@angular/core";
import { Router } from "@angular/router";
import { client } from "src/app/api/api";
import { StatefulService } from "src/app/shared/stateful-service/signal-state.service";

export interface AuthTokensState {
  createLoading: boolean;
  deleteLoading: number[];
  createError: string;
}

const initialState: AuthTokensState = {
  createLoading: false,
  deleteLoading: [],
  createError: "",
};

@Injectable({
  providedIn: "root",
})
export class AuthTokensService extends StatefulService<AuthTokensState> {
  private router = inject(Router);
  apiTokensResource = resource({
    loader: () => client.GET("/api/0/api-tokens/"),
  });

  readonly apiTokens = computed(() => this.apiTokensResource.value()?.data);
  readonly initialLoad = computed(() => this.apiTokensResource.hasValue());
  readonly createError = computed(() => this.state().createError);
  readonly createLoading = computed(() => this.state().createLoading);
  readonly deleteLoading = computed(() => this.state().deleteLoading);

  constructor() {
    super(initialState);
  }

  async createAuthToken(label: string, scopes: string[]) {
    this.setCreateLoadingStart();
    const response = await client.POST("/api/0/api-tokens/", {
      body: {
        label,
        scopes: scopes as any,
      },
    });
    if (response.data) {
      this.setCreateLoadingComplete();
      this.router.navigate(["/profile/auth-tokens"]);
      return;
    }
    this.setCreateLoadingError(
      $localize`There was an error creating your token, please try again.`,
    );
  }

  async deleteAuthToken(id: number) {
    this.setDeleteLoadingStart(id);
    await client.DELETE(`/api/0/api-tokens/{token_id}/`, {
      params: {
        path: {
          token_id: id,
        },
      },
    });
    this.setDeleteLoadingComplete(id);
    this.apiTokensResource.reload();
  }

  private setDeleteLoadingStart(id: number) {
    let state = this.state();
    this.setState({
      deleteLoading: state.deleteLoading.concat([id]),
    });
  }

  private setDeleteLoadingComplete(deletedId: number) {
    let state = this.state();
    this.setState({
      deleteLoading: state.deleteLoading.filter((id) => id !== deletedId),
    });
  }

  private setCreateLoadingStart() {
    this.setState({ createLoading: true, createError: "" });
  }

  private setCreateLoadingComplete() {
    this.setState({ createLoading: false });
  }

  private setCreateLoadingError(error: string) {
    this.setState({
      createError: error,
      createLoading: false,
    });
  }
}
