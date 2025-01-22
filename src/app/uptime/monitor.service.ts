import { Injectable, computed, inject } from "@angular/core";
import { catchError, EMPTY, lastValueFrom, tap } from "rxjs";
import { MatSnackBar } from "@angular/material/snack-bar";
import { Router } from "@angular/router";
import {
  MonitorCheck,
  MonitorDetail,
  MonitorInput,
  ResponseTimeSeries,
} from "./uptime.interfaces";
import { HttpErrorResponse } from "@angular/common/http";
import { ProjectAlertsAPIService } from "../api/projects/project-alerts/project-alerts.service";
import { SettingsService } from "../api/settings.service";
import { SubscriptionsService } from "../api/subscriptions/subscriptions.service";
import { ServerError } from "../shared/django.interfaces";
import { OrganizationsService } from "../api/organizations.service";
import { StatefulService } from "../shared/stateful-service/signal-state.service";
import { client } from "../api/api";

export interface MonitorState {
  monitorDetails: MonitorDetail | null;
  uptimeAlertCount: number | null;
  alertCountLoading: boolean;
  editLoading: boolean;
  createLoading: boolean;
  deleteLoading: boolean;
  error: ServerError | null;
}

const initialState: MonitorState = {
  monitorDetails: null,
  uptimeAlertCount: null,
  alertCountLoading: true,
  editLoading: false,
  createLoading: false,
  deleteLoading: false,
  error: null,
};

@Injectable({
  providedIn: "root",
})
export class MonitorService extends StatefulService<MonitorState> {
  private organizationsService = inject(OrganizationsService);
  private projectAlertsService = inject(ProjectAlertsAPIService);
  private settingsService = inject(SettingsService);
  private subscriptionsService = inject(SubscriptionsService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);

  editLoading = computed(() => this.state().editLoading);
  createLoading = computed(() => this.state().createLoading);
  deleteLoading = computed(() => this.state().deleteLoading);
  error = computed(() => this.state().error);
  uptimeAlertCount = computed(() => this.state().uptimeAlertCount);
  alertCountLoading = computed(() => this.state().alertCountLoading);
  activeMonitor = computed(() => this.state().monitorDetails);

  associatedProjectSlug = computed(() => {
    const projects = this.organizationsService.activeOrganizationProjects();
    const monitor = this.activeMonitor();
    return projects?.find(
      (project) => project.id === monitor?.project?.toString()
    )?.slug;
  });

  activeMonitorRecentChecksSeries = computed(() => {
    const monitor = this.activeMonitor();
    return monitor?.checks.length
      ? this.convertChecksToSeries(monitor.checks)
      : null;
  });

  activeOrganizationSlug = this.organizationsService.activeOrganizationSlug;

  constructor() {
    super(initialState);
  }

  createMonitor(monitor: MonitorInput) {
    const orgSlug = this.organizationsService.activeOrganizationSlug();
    if (orgSlug) {
      this.setCreateMonitorStart();
      client
        .POST("/api/0/organizations/{organization_slug}/monitors/", {
          params: { path: { organization_slug: orgSlug } },
          body: monitor as any,
        })
        .then((result) => {
          if (result.data) {
            const newMonitor = result.data;
            this.setCreateMonitorEnd();
            this.snackBar.open(`${newMonitor.name} has been created`);
            this.router.navigate([orgSlug, "uptime-monitors", newMonitor.id]);
          } else {
            this.processError(result.error);
          }
        });
    }
  }

  callSubscriptionDetails() {
    const billingEnabled = this.settingsService.billingEnabled();
    if (billingEnabled) {
      const slug = this.organizationsService.activeOrganizationSlug();
      if (slug) {
        this.subscriptionsService.retrieveSubscription(slug);
      }
    }
  }

  private processError(err: any) {
    if (err.status === 400) {
      this.setMonitorError(err.error);
    } else if (err instanceof HttpErrorResponse) {
      this.setMonitorError({
        non_field_errors: [`${err.statusText}: ${err.status}`],
      });
    } else {
      this.setMonitorError({
        non_field_errors: [`There was an error updating this monitor.`],
      });
    }
    return EMPTY;
  }

  editMonitor(data: MonitorInput) {
    const monitorId = this.activeMonitor()?.id;
    const organizationSlug = this.activeOrganizationSlug();
    if (!monitorId) {
      return;
    }
    this.setEditMonitorStart();
    client
      .PUT("/api/0/organizations/{organization_slug}/monitors/{monitor_id}/", {
        params: {
          path: {
            organization_slug: organizationSlug,
            monitor_id: parseInt(monitorId),
          },
        },
        body: data as any,
      })
      .then((result) => {
        if (result.data) {
          const updatedMonitor = result.data;
          this.setEditMonitorEnd();
          this.snackBar.open(`${updatedMonitor.name} has been updated`);
          this.router.navigate([
            organizationSlug,
            "uptime-monitors",
            updatedMonitor.id,
          ]);
        } else {
          // Handle error
        }
      });
  }

  retrieveMonitorDetails(orgSlug: string, monitorId: string) {
    client
      .GET("/api/0/organizations/{organization_slug}/monitors/{monitor_id}/", {
        params: {
          path: {
            organization_slug: orgSlug,
            monitor_id: parseInt(monitorId),
          },
        },
      })
      .then((result) => {
        if (result.data) {
          const monitor = result.data;
          this.countUptimeAlerts(orgSlug, monitor as any);
          this.setRetrieveMonitorDetailsEnd(monitor as any);
        } else {
          this.snackBar.open(
            `There was an error retrieving your monitor details. Please try again.`
          );
          this.setRetrieveMonitorDetailsError();
        }
      });
  }

  deleteMonitor() {
    const monitorId = this.activeMonitor()?.id;
    const organizationSlug = this.activeOrganizationSlug();
    if (!monitorId) {
      return;
    }
    this.setDeleteMonitorStart();
    client
      .DELETE(
        "/api/0/organizations/{organization_slug}/monitors/{monitor_id}/",
        {
          params: {
            path: {
              organization_slug: organizationSlug,
              monitor_id: parseInt(monitorId),
            },
          },
        }
      )
      .then((result) => {
        if (result.data) {
          this.setDeleteMonitorEnd();
          this.snackBar.open("Monitor has been deleted.");
          this.router.navigate([organizationSlug, "uptime-monitors"]);
        } else {
          this.setDeleteMonitorError();
          this.snackBar.open(
            `There was an error deleting this issue. Please try again.`
          );
        }
      });
  }

  private countUptimeAlerts(orgSlug: string, monitor: MonitorDetail) {
    const projectSlug = this.associatedProjectSlug();
    if (!monitor.project || !projectSlug) {
      return;
    }
    this.setCountUptimeAlertsStart();
    lastValueFrom(
      this.projectAlertsService.list(orgSlug, projectSlug).pipe(
        tap((projectAlerts) => {
          let alertCount = projectAlerts.filter(
            (alert) => alert.uptime === true
          ).length;
          this.setCountUptimeAlertsEnd(alertCount);
        }),
        catchError(() => {
          this.setCountUptimeAlertsError();
          return EMPTY;
        })
      )
    );
  }

  private formatData(check: MonitorCheck) {
    return {
      name: new Date(check.startCheck),
      value: check.responseTime ?? 0,
    };
  }

  private convertChecksToSeries(input: MonitorCheck[]) {
    return input.reduce(
      (resultArray, check) => {
        const lastEntry = resultArray[resultArray.length - 1];
        if (
          !lastEntry.series.length ||
          (lastEntry.name === "Up" && check.isUp) ||
          (lastEntry.name === "Down" && !check.isUp)
        ) {
          lastEntry.series.push(this.formatData(check));
        } else {
          resultArray.push({
            name: check.isUp ? "Up" : "Down",
            series: [this.formatData(check)],
          });
        }
        return resultArray;
      },
      [
        {
          name: input[0].isUp ? "Up" : "Down",
          series: [],
        },
      ] as ResponseTimeSeries[]
    );
  }

  private setCreateMonitorStart() {
    this.setState({
      createLoading: true,
    });
  }

  private setCreateMonitorEnd() {
    this.setState({
      createLoading: false,
    });
  }

  private setMonitorError(error: ServerError) {
    this.setState({
      createLoading: false,
      editLoading: false,
      error,
    });
  }

  private setEditMonitorStart() {
    this.setState({
      editLoading: true,
    });
  }

  private setEditMonitorEnd() {
    this.setState({
      editLoading: false,
    });
  }

  private setRetrieveMonitorDetailsEnd(monitorDetails: MonitorDetail) {
    this.setState({
      monitorDetails,
    });
  }

  private setRetrieveMonitorDetailsError() {
    this.setState({
      alertCountLoading: false,
    });
  }

  private setDeleteMonitorStart() {
    this.setState({
      deleteLoading: true,
    });
  }

  private setDeleteMonitorEnd() {
    this.clearState();
  }

  private setDeleteMonitorError() {
    this.setState({
      deleteLoading: false,
    });
  }

  private setCountUptimeAlertsStart() {
    this.setState({
      alertCountLoading: true,
    });
  }

  private setCountUptimeAlertsEnd(uptimeAlertCount: number | null) {
    this.setState({
      uptimeAlertCount,
      alertCountLoading: false,
    });
  }

  private setCountUptimeAlertsError() {
    this.setState({
      alertCountLoading: false,
    });
  }
}
