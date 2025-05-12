import { Injectable, computed, inject, resource } from "@angular/core";
import { Router } from "@angular/router";
import { client } from "src/app/api/api";
import { StatefulService } from "src/app/shared/stateful-service/signal-state.service";

export interface AuthTokensState {
  loading: {
    create: boolean;
    delete: number | null;
  };
  createError: string;
  createErrorLabel: string;
  createErrorScopes: string;
}

const initialState: AuthTokensState = {
  // apiTokens: [],
  loading: {
    create: false,
    delete: null,
  },
  createError: "",
  createErrorLabel: "",
  createErrorScopes: "",
};

interface APITokenError {
  detail: { type: string; loc: string[]; msg: string; ctx: any }[];
}

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
  readonly createErrorLabel = computed(() => this.state().createErrorLabel);
  readonly createErrorScopes = computed(() => this.state().createErrorScopes);
  readonly createLoading = computed(() => this.state().loading.create);
  readonly deleteLoading = computed(() => this.state().loading.delete);

  constructor() {
    super(initialState);
  }

  async createAuthToken(label: string, scopes: string[]) {
    this.setCreateLoading(true);
    const { data, error, response } = await client.POST("/api/0/api-tokens/", {
      body: {
        label,
        scopes: scopes as any,
      },
    });
    if (data) {
      this.setCreateLoading(false);
      this.router.navigate(["/profile/auth-tokens"]);
    }
    const statusCode = response.status;
    if (error) {
      const apiTokenError = (error as APITokenError).detail;
      this.setCreateLoading(false);
      if (statusCode === 422) {
        if (apiTokenError[0].loc[2] === "label") {
          this.setCreateLabelError(apiTokenError[0].msg);
        }
        if (apiTokenError[0].loc[2] === "scopes") {
          this.setCreateScopesError(apiTokenError[0].msg);
        }
      } else {
        this.setCreateError(`${statusCode}`);
      }
    }
  }

  async deleteAuthToken(id: number) {
    this.setDeleteLoading(id);
    await client.DELETE(`/api/0/api-tokens/{token_id}/`, {
      params: {
        path: {
          token_id: id,
        },
      },
    });
    this.apiTokensResource.reload();
  }

  resetCreateErrors() {
    this.setState({
      createError: "",
      createErrorLabel: "",
      createErrorScopes: "",
    });
  }

  private setDeleteLoading(id: number) {
    this.setState({
      loading: {
        delete: id,
        create: false,
      },
    });
  }

  private setCreateLoading(isLoading: boolean) {
    this.setState({ loading: { create: isLoading, delete: null } });
  }

  private setCreateError(error: string) {
    this.setState({ createError: error });
  }

  private setCreateLabelError(error: string) {
    this.setState({ createErrorLabel: error });
  }

  private setCreateScopesError(error: string) {
    this.setState({ createErrorScopes: error });
  }
}
