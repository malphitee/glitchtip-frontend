import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  computed,
  inject,
  input,
} from "@angular/core";
import { RouterLink } from "@angular/router";
import { MarkdownModule } from "ngx-markdown";

import { IssuesService } from "../issues.service";
import { ProjectsService } from "src/app/projects/projects.service";
// import { ProjectKeysAPIService } from "src/app/api/projects/project-keys-api.service";
// import { flattenedPlatforms } from "src/app/settings/projects/platform-picker/platforms-for-picker";
import { CopyInputComponent } from "../../shared/copy-input/copy-input.component";
import { OrganizationsService } from "src/app/api/organizations.service";

@Component({
  selector: "gt-issue-zero-states",
  templateUrl: "./issue-zero-states.component.html",
  styleUrls: ["./issue-zero-states.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, CopyInputComponent, MarkdownModule],
})
export class IssueZeroStatesComponent implements OnInit {
  project = input<string[]>();
  private issuesService = inject(IssuesService);
  private organizationsService = inject(OrganizationsService);
  // private projectKeysAPIService = inject(ProjectKeysAPIService);
  private projectsService = inject(ProjectsService);

  loading = computed(
    () => this.projectsService.loading() || this.issuesService.loading(),
  );
  initialLoadComplete = computed(
    () =>
      this.projectsService.initialLoadComplete() &&
      this.issuesService.initialLoad(),
  );
  displayZeroStates = computed(
    () => !this.loading() && this.initialLoadComplete(),
  );
  orgHasAProject = computed(
    () => this.organizationsService.projectsCount() > 0,
  );
  activeOrganizationProjects =
    this.organizationsService.activeOrganizationProjects;
  activeOrganizationSlug = this.organizationsService.activeOrganizationSlug;
  activeProjectID = computed(() => {
    const projectIDs = this.project();
    const activeOrgProjects = this.activeOrganizationProjects();

    if (projectIDs === undefined) {
      return null;
    }

    if (projectIDs.length === 1) {
      return projectIDs[0];
    }
    if (activeOrgProjects?.length === 1) {
      return activeOrgProjects[0].id;
    }
    return null;
  });
  activeProject = computed(() => {
    const projects = this.projectsService.projects();
    const activeProjectID = this.activeProjectID();

    if (projects && activeProjectID) {
      // TODO remove toString
      const activeProject = projects.find(
        (project) => project.id.toString() === activeProjectID,
      );
      return activeProject ? activeProject : null;
    }
    return null;
  });

  showOnboarding = computed(() => !this.activeProject()?.firstEvent);
  activeProjectPlatform = computed(() => this.activeProject()?.platform);
  activeProjectSlug = computed(() => this.activeProject()?.slug);
  activeProjectPlatformName = computed(() => this.activeProject()?.name);

  firstProjectKey = computed(() => {
    return { dsn: { security: "", public: "" } };
    // This is crap, make it run on a service
    // const organizationSlug = this.activeOrganizationSlug();
    // const activeProject = this.activeProject();
    // if (!organizationSlug || !activeProject) {
    //   return null;
    // }
    // return this.projectKeysAPIService
    //   .list(organizationSlug, activeProject.slug)
    //   .pipe(map((keys) => keys[0]));
  });

  // ]).pipe(
  //   filter(
  //     ([organizationSlug, activeProject]) =>
  //       !!organizationSlug && !!activeProject,
  //   ),
  //   distinctUntilChanged((x, y) => JSON.stringify(x) === JSON.stringify(y)),
  //   switchMap(([organizationSlug, activeProject]) =>
  //     this.projectKeysAPIService
  //       .list(organizationSlug!, activeProject!.slug)
  //       .pipe(map((keys) => keys[0])),
  //   ),
  // );

  /**
   * Corresponds to project picker/header nav/project IDs in the URL
   * If the count is zero, we show issues from all projects
   */
  appliedProjectCount = computed(() => this.project()?.length || 0);

  /**
   * Either a single project is applied with the picker, or there's only one
   * project in the org, which is functionally similar for some things
   */
  singleProjectApplied = computed(() => {
    const appliedProjectCount = this.appliedProjectCount();
    const activeOrganizationProjects = this.activeOrganizationProjects();
    return (
      appliedProjectCount === 1 || activeOrganizationProjects?.length === 1
    );
  });

  projectsWhereAdminIsNotOnTheTeam = computed(() => {
    const projectsFromParams = this.project();
    const activeOrganizationProjects = this.activeOrganizationProjects();

    if (projectsFromParams === undefined) {
      return [];
    }

    return activeOrganizationProjects.filter(
      (project) =>
        projectsFromParams.includes(project.id) && project.isMember === false,
    );
  });

  ngOnInit() {
    this.projectsService.retrieveProjects();
    // Attempt to replace YOUR-GLITCHTIP-DSN-HERE with actual project DSN
    // this.firstProjectKey$.subscribe((project) => {
    //   const dsn = project.dsn.public;
    //   const elements = document.querySelectorAll("span.token.string");
    //   for (const element of Array.from(elements)) {
    //     if (element.textContent === '"YOUR-GLITCHTIP-DSN-HERE"') {
    //       element.innerHTML = '"' + dsn + '"';
    //     }
    //   }
    // });
  }
}
