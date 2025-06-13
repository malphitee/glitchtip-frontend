import { Injectable, computed, inject } from "@angular/core";
import { baseUrl } from "src/app/constants";
import { HttpClient } from "@angular/common/http";
import { ProjectsService } from "src/app/projects/projects.service";
import { HttpErrorResponse } from "@angular/common/http";
import {
  ProjectError,
  ProjectAlerts,
  NotificationStatus,
  SubscribeByDefault,
  GroupedProjects,
} from "./notifications.interface";
import { StatefulService } from "src/app/shared/stateful-service/signal-state.service";
import { apiResource } from "src/app/shared/api/api-resource-factory";
import { catchError, EMPTY, tap } from "rxjs";

interface NotificationsState {
  projectViewExpanded: boolean;
  subscribeByDefault: boolean;
  subscribeByDefaultLoading: boolean;
  subscribeByDefaultError: string;
  projectAlertLoading: number | null;
  projectAlertError: ProjectError | null;
}

const initialState: NotificationsState = {
  projectViewExpanded: false,
  subscribeByDefault: true,
  subscribeByDefaultLoading: false,
  subscribeByDefaultError: "",
  projectAlertLoading: null,
  projectAlertError: null,
};

@Injectable()
export class NotificationsService extends StatefulService<NotificationsState> {
  private projectsService = inject(ProjectsService);
  private http = inject(HttpClient);

  #notificationsResource = apiResource(() => ({
    url: "/api/0/users/{user_id}/notifications/",
    options: { params: { path: { user_id: "me" } } },
  }));
  #alertsList = apiResource(() => ({
    url: "/api/0/users/{user_id}/notifications/alerts/",
    options: { params: { path: { user_id: "me" } } },
  }));
  private readonly url = `${baseUrl}/users/me/notifications/`;
  readonly subscribeByDefault = computed(
    () => this.#notificationsResource.value()?.subscribeByDefault || false,
  );
  readonly projectViewExpanded = computed(
    () => this.state().projectViewExpanded,
  );
  readonly subscribeByDefaultLoading = computed(
    () => this.state().subscribeByDefaultLoading,
  );
  readonly subscribeByDefaultError = computed(
    () => this.state().subscribeByDefaultError,
  );
  readonly projectAlertLoading = computed(
    () => this.state().projectAlertLoading,
  );
  readonly projectAlertsError = computed(() => this.state().projectAlertError);
  userAlertSettings = computed(() => {
    const projectAlerts = this.#alertsList.value();
    const projects = this.projectsService.projects();
    if (projectAlerts && projects) {
      const projectsWithAlerts = projects.map((project) => {
        const matchingId = Object.keys(projectAlerts).find(
          (element) => element === project.id,
        );
        return {
          ...project,
          alertStatus: matchingId ? projectAlerts[matchingId] : -1,
        };
      });
      return projectsWithAlerts;
      // this.groupProjectsByOrg(projectsWithAlerts as any);
    }
    return;
  });
  groupedProjects = computed(() => {
    const projects = this.userAlertSettings();
    if (projects) {
      return projects.reduce((r: GroupedProjects, a: any) => {
        r[+a.organization.id] = [...(r[+a.organization.id] || []), a];
        return r;
      }, {});
    }
    return [];
  });

  constructor() {
    super(initialState);
  }

  subscribeToEndpoints() {
    this.projectsService.retrieveProjects();
  }

  alertsUpdate(projectId: number, status: NotificationStatus) {
    const data: ProjectAlerts = {
      [projectId]: status,
    };
    this.setProjectAlertLoading(projectId);
    return this.http
      .put<ProjectAlerts>(`${this.url}alerts/`, data)
      .pipe(
        tap((_) => {
          this.#alertsList.reload();
          this.setProjectAlertLoading(null);
        }),
        catchError((error) => {
          if (error) {
            this.setProjectAlertLoading(null);
            this.setProjectAlertError(this.error(error), projectId);
          }
          return EMPTY;
        }),
      )
      .toPromise();
  }

  notificationsUpdate(subscribe: boolean) {
    const data = { subscribeByDefault: subscribe };
    this.setSubscribeByDefaultLoading(true);
    return this.http
      .put<SubscribeByDefault>(this.url, data)
      .pipe(
        tap((resp) => {
          this.setSubscribeByDefaultLoading(false);
          this.setSubscribeByDefault(resp.subscribeByDefault);
        }),
        catchError((error) => {
          if (error) {
            this.setSubscribeByDefaultLoading(false);
            this.setSubscribeByDefaultError(this.error(error));
          }
          return EMPTY;
        }),
      )
      .subscribe();
  }

  error(error: HttpErrorResponse): string {
    return `${error.name}: ${error.statusText}`;
  }

  toggleProjectView() {
    this.setToggleProjectView();
  }

  private setSubscribeByDefault(subscribe: boolean) {
    this.setState({
      ...this.state(),
      subscribeByDefault: subscribe,
    });
  }

  private setToggleProjectView() {
    const projectViewExpanded = this.state().projectViewExpanded;
    this.setState({
      ...this.state(),
      projectViewExpanded: !projectViewExpanded,
    });
  }

  private setSubscribeByDefaultError(error: string) {
    this.setState({
      ...this.state(),
      subscribeByDefaultError: error,
    });
  }

  private setSubscribeByDefaultLoading(loading: boolean) {
    this.setState({
      ...this.state(),
      subscribeByDefaultLoading: loading,
    });
  }

  private setProjectAlertLoading(projectId: number | null) {
    this.setState({
      ...this.state(),
      projectAlertLoading: projectId,
    });
  }

  private setProjectAlertError(error: string, id: number) {
    this.setState({
      ...this.state(),
      projectAlertError: { error, id },
    });
  }
}
