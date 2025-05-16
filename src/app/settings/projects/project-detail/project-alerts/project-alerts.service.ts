import {
  Injectable,
  ResourceStatus,
  computed,
  inject,
  resource,
  signal,
} from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";
import { StatefulService } from "src/app/shared/stateful-service/signal-state.service";
import { components } from "src/app/api/api-schema";
import { client } from "src/app/api/api";

type ProjectAlert = components["schemas"]["ProjectAlertSchema"];
type AlertRecipient = components["schemas"]["AlertRecipientSchema"];
type NewAlertRecipient = any;

interface NewAlertState {
  newAlertOpen: boolean;
  newProjectAlertRecipients: NewAlertRecipient[] | null;
  newAlertLoading: boolean;
  newAlertError: string | null;
}

interface RecipientDialogState {
  recipientError: string | null;
  recipientDialogOpen: ProjectAlert | boolean;
  activeAlert: ProjectAlert | null;
}

interface ProjectAlertState {
  projectAlerts: ProjectAlert[] | null;
  newAlertState: NewAlertState;
  recipientDialogState: RecipientDialogState;
  // current alerts
  removeAlertLoading: number | null;
  removeAlertError: { error: string; id: number } | null;
  updatePropertiesLoading: number | null;
  updatePropertiesError: { error: string; id: number } | null;
  deleteRecipientLoading: number | null;
  deleteRecipientError: string | null;
}

const initialNewAlertState = {
  newAlertOpen: false,
  newProjectAlertRecipients: null,
  newAlertLoading: false,
  newAlertError: null,
};

const initialRecipientDialogState = {
  recipientError: null,
  recipientDialogOpen: false,
  activeAlert: null,
};

const initialState: ProjectAlertState = {
  projectAlerts: null,
  newAlertState: initialNewAlertState,
  recipientDialogState: initialRecipientDialogState,
  // current alerts
  removeAlertLoading: null,
  removeAlertError: null,
  updatePropertiesLoading: null,
  updatePropertiesError: null,
  deleteRecipientLoading: null,
  deleteRecipientError: null,
};

@Injectable()
export class ProjectAlertsService extends StatefulService<ProjectAlertState> {
  private snackBar = inject(MatSnackBar);

  #params = signal({ orgSlug: "", projectSlug: "" });
  #projectAlertsResource = resource({
    request: () => ({ params: this.#params() }),
    loader: async ({ request }) => {
      if (!request.params.orgSlug) {
        return undefined;
      }
      const { data, error } = await client.GET(
        "/api/0/projects/{organization_slug}/{project_slug}/alerts/",
        {
          params: {
            path: {
              organization_slug: request.params.orgSlug,
              project_slug: request.params.projectSlug,
            },
          },
        },
      );
      if (error) {
        throw $localize`There was an error loading your alerts. Try refreshing the page.`;
      }
      return data;
    },
  });
  readonly initialLoad = computed(
    () =>
      this.#projectAlertsResource.status() > ResourceStatus.Loading ||
      this.#projectAlertsResource.error(),
  );
  readonly initialLoadError = computed(() =>
    this.#projectAlertsResource.error(),
  );
  readonly projectAlerts = computed(() => {
    const alerts = this.#projectAlertsResource.value();
    return alerts?.map((alert) => {
      return {
        ...alert,
        errorAlert: !alert.timespanMinutes && !alert.quantity ? false : true,
      };
    });
  });

  /** New Alert */
  readonly newAlertOpen = computed(
    () => this.state().newAlertState.newAlertOpen,
  );
  readonly newProjectAlertRecipients = computed(
    () => this.state().newAlertState.newProjectAlertRecipients,
  );
  readonly newAlertLoading = computed(
    () => this.state().newAlertState.newAlertLoading,
  );
  readonly newAlertError = computed(
    () => this.state().newAlertState.newAlertError,
  );

  /** Recipient Dialog */
  readonly recipientError = computed(
    () => this.state().recipientDialogState.recipientError,
  );
  readonly recipientDialogOpen = computed(
    () => this.state().recipientDialogState.recipientDialogOpen,
  );
  readonly activeAlert = computed(
    () => this.state().recipientDialogState.activeAlert,
  );
  readonly emailSelected = computed(() => {
    const newRecipients = this.newProjectAlertRecipients();
    const activeAlert = this.activeAlert();
    if (activeAlert?.id) {
      return activeAlert.alertRecipients.some(
        (data: any) => data.recipientType === "email",
      );
    } else if (newRecipients !== null) {
      return newRecipients.some((data) => data.recipientType === "email");
    }
    return;
  });

  /** Current Alerts */
  readonly removeAlertLoading = computed(() => this.state().removeAlertLoading);
  readonly removeAlertError = computed(() => this.state().removeAlertError);
  readonly updatePropertiesLoading = computed(
    () => this.state().updatePropertiesLoading,
  );
  readonly updatePropertiesError = computed(
    () => this.state().updatePropertiesError,
  );
  readonly deleteRecipientLoading = computed(
    () => this.state().deleteRecipientLoading,
  );
  readonly deleteRecipientError = computed(
    () => this.state().deleteRecipientError,
  );

  constructor() {
    super(initialState);
  }

  setParams(orgSlug: string, projectSlug: string) {
    this.#params.set({ orgSlug, projectSlug });
  }

  /** New Alert Actions */
  openNewAlert() {
    this.setOpenNewAlert();
  }

  closeNewAlert() {
    this.setCloseNewAlert();
  }

  addAlertRecipient(event: NewAlertRecipient) {
    // Force https:// if no protocol exists
    if (event.url && !event.url.startsWith("http")) {
      event.url = "https://" + event.url;
    }
    // combineLatest([this.newProjectAlertRecipients$, this.activeAlert$])
    //   .pipe(
    //     take(1),
    //     exhaustMap(([newRecipients, activeAlert]) => {
    //       if (newRecipients !== null) {
    //         this.setAddNewAlertRecipient(event);
    //       } else if (activeAlert?.alertRecipients !== null) {
    //         this.updateAlertRecipient(event);
    //       }
    //       return EMPTY;
    //     }),
    //   )
    //   .subscribe();
  }

  removeNewAlertRecipient(url: string) {
    this.setRemoveNewAlertRecipient(url);
  }

  async createNewAlert(properties: {
    timespanMinutes: number;
    quantity: number;
    uptime: boolean;
  }) {
    this.setNewAlertLoading();
    const body = {
      timespanMinutes: properties.timespanMinutes,
      quantity: properties.quantity,
      uptime: properties.uptime,
      alertRecipients: this.newProjectAlertRecipients(),
    };
    const params = this.#params();
    const { data } = await client.POST(
      "/api/0/projects/{organization_slug}/{project_slug}/alerts/",
      {
        params: {
          path: {
            organization_slug: params.orgSlug,
            project_slug: params.projectSlug,
          },
        },
        body,
      },
    );
    if (data) {
      this.setCreateAlert(data);
      this.snackBar.open(`Success! Your new alert has been added.`);
    }

    //
    //       this.setCreateAlertError(err);
  }

  /** Update Actions */
  async deleteProjectAlert(id: number) {
    this.setDeleteAlertLoading(id);
    const { error, response } = await client.DELETE(
      "/api/0/projects/{organization_slug}/{project_slug}/alerts/{alert_id}/",
      {
        params: {
          path: {
            organization_slug: this.#params().orgSlug,
            project_slug: this.#params().projectSlug,
            alert_id: id,
          },
        },
      },
    );
    if (response.status === 204) {
      this.setDeleteProjectAlert(id);
      this.snackBar.open(`Success: Your alert has been deleted`);
    } else if (error) {
      this.setDeleteAlertError(error, id);
    }
  }

  updateAlertProperties(
    newTimespan: number,
    newQuantity: number,
    uptime: boolean,
    id: number,
    recipients: AlertRecipient[],
  ) {
    this.setUpdatePropertiesLoading(id);
    // const data: PartialProjectAlert = {
    //   id: id,
    //   timespanMinutes: newTimespan,
    //   quantity: newQuantity,
    //   uptime,
    //   alertRecipients: recipients,
    // };
    // combineLatest([
    //   this.organizationsService.activeOrganizationSlug$,
    //   this.activeProjectSlug$,
    // ])
    //   .pipe(
    //     take(1),
    //     mergeMap(([orgSlug, projectSlug]) => {
    //       if (orgSlug && projectSlug) {
    //         return this.projectAlertsAPIService
    //           .update(id.toString(), data, orgSlug, projectSlug)
    //           .pipe(
    //             tap((resp) => {
    //               this.setUpdateAlertProperties(resp);
    //               this.snackBar.open(`Success: Your alert has been updated`);
    //             }),
    //           );
    //       }
    //       return EMPTY;
    //     }),
    //     catchError((err: HttpErrorResponse) => {
    //       this.setUpdatePropertiesError(err, id);
    //       return EMPTY;
    //     }),
    //   )
    //   .subscribe();
  }

  updateAlertRecipient(newRecipient: NewAlertRecipient) {
    // let activeErrorId = 0;
    // combineLatest([
    //   this.activeAlert$,
    //   this.organizationsService.activeOrganizationSlug$,
    //   this.activeProjectSlug$,
    // ])
    //   .pipe(
    //     take(1),
    //     exhaustMap(([activeAlert, orgSlug, projectSlug]) => {
    //       if (activeAlert && orgSlug && projectSlug) {
    //         activeErrorId = activeAlert.id;
    //         const recipientsWithoutId: NewAlertRecipient[] =
    //           activeAlert.alertRecipients
    //             .map((recipient) => {
    //               return {
    //                 recipientType: recipient.recipientType,
    //                 url: recipient.url,
    //               };
    //             })
    //             .concat([newRecipient]);
    //         const data = {
    //           timespanMinutes: activeAlert.timespanMinutes,
    //           quantity: activeAlert.quantity,
    //           uptime: activeAlert.uptime,
    //           alertRecipients: recipientsWithoutId,
    //         };
    //         return this.projectAlertsAPIService
    //           .update(activeAlert.id.toString(), data, orgSlug, projectSlug)
    //           .pipe(
    //             tap((resp) => {
    //               this.setUpdateAlertRecipients(resp.alertRecipients, resp.id);
    //               this.snackBar.open(`Success: Your alert has been updated`);
    //             }),
    //           );
    //       }
    //       return EMPTY;
    //     }),
    //     catchError((err: HttpErrorResponse) => {
    //       this.setUpdateAlertRecipientsError(err, activeErrorId);
    //       return EMPTY;
    //     }),
    //   )
    //   .subscribe();
  }

  deleteAlertRecipient(recipientToRemove: AlertRecipient, alert: ProjectAlert) {
    // this.setDeleteRecipientLoading(recipientToRemove.id);
    // const data = {
    //   ...alert,
    //   alertRecipients: alert.alertRecipients.filter(
    //     (currentRecipient) => currentRecipient.id !== recipientToRemove.id,
    //   ),
    // };
    // combineLatest([
    //   this.organizationsService.activeOrganizationSlug$,
    //   this.activeProjectSlug$,
    // ])
    //   .pipe(
    //     take(1),
    //     mergeMap(([orgSlug, projectSlug]) => {
    //       if (orgSlug && projectSlug) {
    //         return this.projectAlertsAPIService
    //           .update(alert.id.toString(), data, orgSlug, projectSlug)
    //           .pipe(
    //             tap((resp) => {
    //               this.setUpdateAlertRecipients(resp.alertRecipients, resp.id);
    //               this.snackBar.open(
    //                 `Success: Your recipient has been deleted`,
    //               );
    //             }),
    //           );
    //       }
    //       return EMPTY;
    //     }),
    //     catchError((err: HttpErrorResponse) => {
    //       this.setDeleteRecipientError(err);
    //       return EMPTY;
    //     }),
    //   )
    //   .subscribe();
  }

  openUpdateRecipientDialog(alert: ProjectAlert) {
    this.setOpenUpdateRecipientDialog(alert);
  }

  openCreateRecipientDialog() {
    this.setOpenCreateRecipientDialog();
  }

  closeRecipientDialog() {
    this.setCloseRecipientDialog();
  }

  /** Set state */

  // private setProjectAlertsList(alerts: ProjectAlert[]) {
  //   this.setState({
  //     projectAlerts: alerts,
  //     initialLoad: true,
  //     initialLoadError: null,
  //   });
  // }

  // private setProjectAlertsListError(err: any) {
  //   this.setState({
  //     initialLoad: true,
  //     initialLoadError: `There was an error loading your alerts. Try refreshing the page.`,
  //   });
  // }

  /** New Alert */

  private setOpenNewAlert() {
    const newAlertState = this.state().newAlertState;
    this.setState({
      newAlertState: {
        ...newAlertState,
        newAlertOpen: true,
        newProjectAlertRecipients: [{ recipientType: "email", url: "" }],
      },
    });
  }

  private setCloseNewAlert() {
    const newAlertState = this.state().newAlertState;
    this.setState({
      newAlertState: {
        ...newAlertState,
        newAlertOpen: false,
        newAlertError: null,
        newProjectAlertRecipients: null,
      },
    });
  }

  // private setAddNewAlertRecipient(recipient: NewAlertRecipient) {
  //   const newAlertState = this.state().newAlertState;
  //   const recipientDialogState = this.state().recipientDialogState;
  //   this.setState({
  //     newAlertState: {
  //       ...newAlertState,
  //       newProjectAlertRecipients:
  //         newAlertState.newProjectAlertRecipients?.concat([recipient]) ?? null,
  //     },
  //     recipientDialogState: {
  //       ...recipientDialogState,
  //       recipientDialogOpen: false,
  //     },
  //   });
  // }

  private setRemoveNewAlertRecipient(url: string) {
    const newAlertState = this.state().newAlertState;
    this.setState({
      newAlertState: {
        ...newAlertState,
        newProjectAlertRecipients:
          newAlertState.newProjectAlertRecipients?.filter(
            (recipient) => recipient.url !== url,
          ) ?? null,
      },
    });
  }

  private setNewAlertLoading() {
    const newAlertState = this.state().newAlertState;
    this.setState({
      newAlertState: {
        ...newAlertState,
        newAlertLoading: true,
      },
    });
  }

  private setCreateAlert(alert: ProjectAlert) {
    const state = this.state();
    this.setState({
      projectAlerts: state.projectAlerts?.concat([alert]),
      newAlertState: initialNewAlertState,
    });
  }

  // private setCreateAlertError(error: any) {
  //   const newAlertState = this.state().newAlertState;
  //   this.setState({
  //     newAlertState: {
  //       ...newAlertState,
  //       newAlertError: `${error.statusText} : ${error.status}`,
  //       newAlertLoading: false,
  //     },
  //   });
  // }

  private setOpenCreateRecipientDialog() {
    const recipientDialogState = this.state().recipientDialogState;
    this.setState({
      recipientDialogState: {
        ...recipientDialogState,
        recipientDialogOpen: true,
        activeAlert: null,
      },
    });
  }

  /** Recipient Dialog */

  private setCloseRecipientDialog() {
    const recipientDialogState = this.state().recipientDialogState;
    this.setState({
      recipientDialogState: {
        ...recipientDialogState,
        recipientDialogOpen: false,
        recipientError: null,
        activeAlert: null,
      },
    });
  }

  private setOpenUpdateRecipientDialog(alert: ProjectAlert) {
    const recipientDialogState = this.state().recipientDialogState;
    this.setState({
      recipientDialogState: {
        ...recipientDialogState,
        recipientDialogOpen: true,
        recipientError: null,
        activeAlert: alert,
      },
    });
  }

  /** Alert Updates */

  private setDeleteAlertLoading(id: number) {
    this.setState({
      removeAlertLoading: id,
      removeAlertError: null,
    });
  }

  private setDeleteProjectAlert(id: number) {
    const state = this.state();
    this.setState({
      projectAlerts:
        state.projectAlerts?.filter((alert) => alert.id !== id) ?? null,
      removeAlertLoading: null,
      removeAlertError: null,
    });
  }

  private setDeleteAlertError(err: any, id: number) {
    const state = this.state();
    this.setState({
      removeAlertError: {
        ...state.removeAlertError,
        error: `${err.statusText} : ${err.status}`,
        id,
      },
      removeAlertLoading: null,
    });
  }

  // private setUpdateAlertProperties(updatedAlert: ProjectAlert) {
  //   const state = this.state();
  //   this.setState({
  //     projectAlerts: this.findAndReplaceAlert(
  //       state.projectAlerts,
  //       updatedAlert,
  //     ),
  //     updatePropertiesLoading: null,
  //     updatePropertiesError: null,
  //   });
  // }

  private setUpdatePropertiesLoading(id: number) {
    this.setState({
      updatePropertiesLoading: id,
      updatePropertiesError: null,
    });
  }

  // private setUpdatePropertiesError(err: any, id: number) {
  //   const state = this.state();
  //   this.setState({
  //     updatePropertiesLoading: null,
  //     updatePropertiesError: {
  //       ...state.updatePropertiesError,
  //       error: `${err.statusText} : ${err.status}`,
  //       id,
  //     },
  //   });
  // }

  // private setUpdateAlertRecipientsError(err: any, id: number) {
  //   const recipientDialogState = this.state().recipientDialogState;
  //   this.setState({
  //     recipientDialogState: {
  //       ...recipientDialogState,
  //       recipientError: `${err.statusText} : ${err.status}`,
  //     },
  //   });
  // }

  // private setUpdateAlertRecipients(recipients: AlertRecipient[], id: number) {
  //   const state = this.state();
  //   const recipientDialogState = this.state().recipientDialogState;
  //   this.setState({
  //     projectAlerts: state.projectAlerts?.map((alert) =>
  //       alert.id === id ? { ...alert, alertRecipients: recipients } : alert,
  //     ),
  //     recipientDialogState: {
  //       ...recipientDialogState,
  //       recipientError: null,
  //       recipientDialogOpen: false,
  //       activeAlert: null,
  //     },
  //     deleteRecipientLoading: null,
  //     deleteRecipientError: null,
  //   });

  //   this.setState({});
  // }

  // private setDeleteRecipientLoading(id: number) {
  //   const recipientDialogState = this.state().recipientDialogState;
  //   this.setState({
  //     recipientDialogState: {
  //       ...recipientDialogState,
  //       recipientError: null,
  //     },
  //     deleteRecipientLoading: id,
  //   });

  //   this.setState({});
  // }

  // private setDeleteRecipientError(err: any) {
  //   this.setState({
  //     deleteRecipientError: `${err.statusText} : ${err.status}`,
  //     deleteRecipientLoading: null,
  //   });
  // }

  /** Utility Functions */

  findAndReplaceAlert(
    currentAlerts: ProjectAlert[] | null,
    newAlert: ProjectAlert,
  ): ProjectAlert[] | null {
    const updatedAlert = currentAlerts?.map((alert) => {
      if (alert.id === newAlert.id) {
        return {
          ...alert,
          timespanMinutes: newAlert.timespanMinutes,
          quantity: newAlert.quantity,
          uptime: newAlert.uptime,
        };
      } else return alert;
    });
    return updatedAlert !== undefined ? updatedAlert : null;
  }
}
