import {
  Injectable,
  ResourceStatus,
  computed,
  inject,
  resource,
} from "@angular/core";
import { MatSnackBar } from "@angular/material/snack-bar";
import { IssueWithMatchingEvent } from "./interfaces";
import { client } from "../api/api";
import { StatefulService } from "../shared/stateful-service/signal-state.service";
import { OrganizationsService } from "../api/organizations.service";
import { getPaginationHeaders, getPaginator } from "../shared/pagination.utils";

export interface IssuesState {
  directHit?: IssueWithMatchingEvent;
  selectedIssues: string[];
  allResultsSelected: boolean;
}

const initialState: IssuesState = {
  selectedIssues: [],
  allResultsSelected: false,
};

@Injectable()
export class IssuesService extends StatefulService<IssuesState> {
  private snackbar = inject(MatSnackBar);
  private organizationsService = inject(OrganizationsService);

  private issuesResource = resource({
    request: () => ({
      organizationSlug: this.organizationsService.activeOrganizationSlug(),
      // cursor: this.cursor(),
    }),
    // Define an async loader that retrieves data.
    // The resource calls this function every time the `request` value changes.
    loader: async ({ request }) => {
      const { error, data, response } = await client.GET(
        "/api/0/organizations/{organization_slug}/issues/",
        {
          params: {
            path: { organization_slug: request.organizationSlug },
            // query: { cursor: request.cursor },
          },
        },
      );
      if (error) {
        this.snackbar.open(
          $localize`There was an error when attempting to load issues.`,
        );
      }
      const pagination = getPaginationHeaders(response);
      return { data, pagination };
    },
  });
  loading = computed(() => this.issuesResource.isLoading());
  issues = computed(() => this.issuesResource.value()?.data);
  pagination = computed(() => this.issuesResource.value()?.pagination);
  paginator = computed(() => getPaginator(this.pagination()));
  initialLoad = computed(
    () => this.issuesResource.status() > ResourceStatus.Loading,
  );

  selectedIssues = computed(() => this.state().selectedIssues);
  issuesWithSelected = computed(() => {
    const issues = this.issues();
    if (issues === undefined) {
      return [];
    }
    return issues.map((issue) => ({
      ...issue,
      isSelected: this.selectedIssues().includes(issue.id),
      projectSlug: issue.project?.slug,
    }));
  });
  // issuesWithSelected$: Observable<IssueWithSelected[]> = combineLatest([
  //   this.issues$,
  //   this.selectedIssues$,
  // ]).pipe(
  //   map(([issues, selectedIssues]) =>
  //     issues.map((issue) => ({
  //       ...issue,
  //       isSelected: selectedIssues.includes(issue.id) ? true : false,
  //       projectSlug: issue.project?.slug,
  //     })),
  //   ),
  // );
  areAllSelected = computed(() => {
    const issues = this.issues();
    return (
      issues && issues.length === this.selectedIssues().length && issues.length
    );
  });
  // readonly searchDirectHit$ = this.getState$.pipe(
  //   map((state) => state.directHit),
  //   filter((directHit): directHit is IssueWithMatchingEvent => !!directHit),
  // );
  numberOfSelectedIssues = computed(() => this.selectedIssues().length);
  thereAreSelectedIssues = computed(() => this.numberOfSelectedIssues() > 0);
  allResultsSelected = computed(() => this.state().allResultsSelected);

  constructor() {
    super(initialState);
  }

  // getIssues(
  //   organizationSlug?: string,
  //   cursor?: string | null,
  //   query: string | null = "is:unresolved",
  //   project?: number[] | null,
  //   start?: string | null,
  //   end?: string | null,
  //   sort?: string | null,
  //   environment?: string | null,
  // ) {
  //   this.setIssuesLoading();
  //   return this.issuesAPIService
  //     .list(
  //       organizationSlug,
  //       cursor,
  //       query,
  //       project,
  //       start,
  //       end,
  //       sort,
  //       environment,
  //     )
  //     .pipe(
  //       tap((res) => {
  //         let directHit: IssueWithMatchingEvent | undefined;
  //         if (
  //           res.headers.has("x-sentry-direct-hit") &&
  //           res.headers.get("x-sentry-direct-hit") === "1" &&
  //           res.body![0] &&
  //           (res.body![0] as IssueWithMatchingEvent).matchingEventId
  //         ) {
  //           directHit = res.body![0] as IssueWithMatchingEvent;
  //         }
  //         this.setStateAndPagination({ issues: res.body!, directHit }, res);
  //       }),
  //       catchError((err: HttpErrorResponse) => {
  //         this.setIssuesError(err);
  //         return EMPTY;
  //       }),
  //     );
  // }

  // toggleSelectOne(issueId: number) {
  //   lastValueFrom(
  //     this.selectedIssues$.pipe(
  //       take(1),
  //       tap((selectedIssues) => {
  //         let updatedSelection = [];
  //         if (selectedIssues.includes(issueId)) {
  //           updatedSelection = selectedIssues.filter(
  //             (issue) => issue !== issueId,
  //           );
  //         } else {
  //           updatedSelection = selectedIssues.concat([issueId]);
  //         }
  //         this.setUpdateSelectedIssues(updatedSelection);
  //       }),
  //     ),
  //   );
  // }

  // toggleSelectAllOnPage() {
  //   lastValueFrom(
  //     combineLatest([this.issues$, this.selectedIssues$]).pipe(
  //       take(1),
  //       tap(([issues, selectedIssues]) => {
  //         if (issues.length === selectedIssues.length) {
  //           this.setCancelAllOnPageSelection();
  //         } else {
  //           this.setSelectAllOnPage();
  //         }
  //       }),
  //     ),
  //   );
  // }

  selectAllResults() {
    this.setAllResultsSelected();
  }

  cancelAllResultsSelection() {
    this.setCancelAllResultsSelection();
  }

  // updateStatusByIssueId(orgSlug: string, status: IssueStatus) {
  //   if (status === "merge") {
  //     lastValueFrom(
  //       this.selectedIssues$.pipe(
  //         take(1),
  //         tap((issues) => this.mergeIssues(orgSlug, issues)),
  //       ),
  //     );
  //     return;
  //   }

  //   lastValueFrom(
  //     this.selectedIssues$.pipe(
  //       take(1),
  //       tap((issues) => {
  //         lastValueFrom(
  //           this.issuesAPIService.bulkUpdate(status, orgSlug, issues).pipe(
  //             tap((resp) => {
  //               this.setUpdateStatusByIssueIdComplete(issues, resp.status);
  //             }),
  //             catchError((err: HttpErrorResponse) => {
  //               this.snackbar.open("Error, unable to update issue");
  //               return EMPTY;
  //             }),
  //           ),
  //         );
  //       }),
  //     ),
  //   );
  // }

  async mergeIssues(orgSlug: string, issues: number[]) {
    await client.PUT("/api/0/organizations/{organization_slug}/issues/", {
      params: {
        path: {
          organization_slug: orgSlug,
        },
        query: {
          id: issues,
        },
      },
      body: { merge: 1 },
    });
    this.issuesResource.reload();
  }

  // bulkUpdateStatus(
  //   status: IssueStatus,
  //   orgSlug: string,
  //   projectIds: number[],
  //   query?: string | null,
  //   start?: string | null,
  //   end?: string | null,
  //   environment?: string | null,
  // ) {
  //   lastValueFrom(
  //     this.issuesAPIService
  //       .bulkUpdate(
  //         status,
  //         orgSlug,
  //         [],
  //         projectIds,
  //         query,
  //         start,
  //         end,
  //         environment,
  //       )
  //       .pipe(
  //         tap((resp) => {
  //           this.setBulkUpdateComplete(resp.status);
  //         }),
  //         catchError((err: HttpErrorResponse) => {
  //           this.snackbar.open("Error, unable to update issue");
  //           return EMPTY;
  //         }),
  //       ),
  //   );
  // }

  // private setUpdateSelectedIssues(selectedIssues: number[]) {
  //   this.setState({
  //     selectedIssues,
  //     allResultsSelected: false,
  //   });
  // }

  // private setSelectAllOnPage() {
  //   const issues = this.issues();
  //   if (issues) {
  //     this.setState({
  //       selectedIssues: issues.map((issue) => issue.id),
  //     });
  //   }
  // }

  // private setCancelAllOnPageSelection() {
  //   this.setState({
  //     selectedIssues: [],
  //     allResultsSelected: false,
  //   });
  // }

  private setAllResultsSelected() {
    this.setState({
      allResultsSelected: true,
    });
  }

  private setCancelAllResultsSelection() {
    this.setState({
      allResultsSelected: false,
    });
  }

  // private setIssuesLoading() {
  //   const state = this.state.getValue();
  //   this.setState({
  //     directHit: undefined,
  //     selectedIssues: [],
  //     allResultsSelected: false,
  //     pagination: {
  //       ...state.pagination,
  //       initialLoadComplete: false,
  //       loading: true,
  //     },
  //   });
  // }

  // private setUpdateStatusByIssueIdComplete(
  //   issueIds: number[],
  //   status: IssueStatus,
  // ) {
  //   const state = this.state.getValue();
  //   this.setState({
  //     issues: state.issues.map((issue) =>
  //       issueIds.includes(issue.id) ? { ...issue, status } : issue,
  //     ),
  //     selectedIssues: [],
  //   });
  // }

  // private setBulkUpdateComplete(status: IssueStatus) {
  //   this.setState({
  //     // issues: state.issues.map((issue) => {
  //     //   return { ...issue, status };
  //     // }),
  //     selectedIssues: [],
  //     allResultsSelected: false,
  //   });
  // }
}
