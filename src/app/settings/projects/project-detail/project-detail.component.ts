import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  ViewChild,
  effect,
  inject,
  input,
} from "@angular/core";
import {
  FormGroup,
  FormControl,
  Validators,
  FormGroupDirective,
  ReactiveFormsModule,
} from "@angular/forms";
import { RouterLink } from "@angular/router";
import { flattenedPlatforms } from "src/app/settings/projects/platform-picker/platforms-for-picker";
import { ProjectSettingsService } from "../project-settings.service";
import { MatButtonModule } from "@angular/material/button";
import { ProjectAlertsComponent } from "./project-alerts/project-alerts.component";
import { ProjectEnvironmentsComponent } from "./project-environments/project-environments.component";
import { CopyInputComponent } from "../../../shared/copy-input/copy-input.component";
import { PlatformPickerComponent } from "../platform-picker/platform-picker.component";
import { LoadingButtonComponent } from "../../../shared/loading-button/loading-button.component";
import { MatInputModule } from "@angular/material/input";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatDividerModule } from "@angular/material/divider";
import { MatCardModule } from "@angular/material/card";
import { DetailHeaderComponent } from "src/app/shared/detail/header/header.component";
import { ProjectDetailService } from "./project-detail.service";

@Component({
  selector: "gt-project-detail",
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./project-detail.component.html",
  styleUrls: ["./project-detail.component.scss"],
  imports: [
    MatCardModule,
    MatDividerModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatInputModule,
    LoadingButtonComponent,
    PlatformPickerComponent,
    CopyInputComponent,
    ProjectEnvironmentsComponent,
    ProjectAlertsComponent,
    MatButtonModule,
    RouterLink,
    DetailHeaderComponent,
  ],
  providers: [ProjectDetailService],
})
export class ProjectDetailComponent implements OnInit {
  private projectsService = inject(ProjectSettingsService);
  private service = inject(ProjectDetailService);

  @ViewChild(FormGroupDirective) formDirective: FormGroupDirective | undefined;

  projectKeys = this.service.projectKeys;
  activeProject = this.service.project;

  orgSlug = input.required<string>({ alias: "org-slug" });
  projectSlug = input.required<string>({ alias: "project-slug" });

  deleteLoading = false;
  deleteError = "";
  updateNameLoading = false;
  updateNameError = "";
  updatePlatformLoading = false;
  updatePlatformError = "";

  nameForm = new FormGroup({
    name: new FormControl("", [Validators.required, Validators.maxLength(64)]),
  });

  platformForm = new FormGroup({
    platform: new FormControl(""),
  });

  get name() {
    return this.nameForm.get("name");
  }

  get platform() {
    return this.platformForm.get("platform");
  }

  constructor() {
    effect(() => {
      const project = this.activeProject();
      if (project) {
        this.nameForm.patchValue({
          name: project!.name,
        });
        this.platformForm.patchValue({
          platform: project!.platform,
        });
      }
    });
  }

  getPlatformName = (id: string) =>
    flattenedPlatforms.find((platform) => platform.id === id)?.name || id;

  ngOnInit() {
    this.service.setParams(this.orgSlug(), this.projectSlug());
  }

  deleteProject() {
    if (
      window.confirm("Are you sure you want to delete this project?") &&
      this.orgSlug() &&
      this.projectSlug()
    ) {
      this.deleteLoading = true;
      // this.projectsService
      //   .deleteProject(this.orgSlug, this.projectSlug)
      //   .subscribe(
      //     () => {
      //       this.deleteLoading = false;
      //       this.orgService.refreshActiveOrganization();
      //       this.snackBar.open("Your project has been sucessfully deleted");
      //       this.router.navigate([this.orgSlug, "settings", "projects"]);
      //     },
      //     (err) => {
      //       this.deleteLoading = false;
      //       this.deleteError = `${err.statusText}: ${err.status}`;
      //     },
      //   );
    }
  }

  updateName() {
    this.updateNameLoading = true;
    if (this.nameForm.valid && this.orgSlug && this.projectSlug) {
      this.projectsService.updateProjectName(
        this.orgSlug(),
        this.projectSlug(),
        this.nameForm.value.name!,
      );
      // .subscribe(
      //   (resp: ProjectDetail) => {
      //     this.updateNameLoading = false;
      //     if (this.updateNameError) {
      //       this.updateNameError = "";
      //     }
      //     this.snackBar.open(
      //       `The name of your project has been updated to ${resp.name}`,
      //     );
      //   },
      //   (err) => {
      //     this.updateNameError = `${err.statusText}: ${err.status}`;
      //   },
      // );
    }
  }

  updatePlatform(projectName: string) {
    this.updatePlatformLoading = true;
    if (this.orgSlug && this.projectSlug) {
      this.projectsService.updateProjectPlatform(
        this.orgSlug(),
        this.projectSlug(),
        this.platformForm.value.platform ?? "",
        projectName,
      );
      // .subscribe(
      //   (resp: ProjectDetail) => {
      //     this.updatePlatformLoading = false;
      //     if (this.updatePlatformError) {
      //       this.updatePlatformError = "";
      //     }
      //     this.snackBar.open(
      //       `Your project platform has been updated to ${this.getPlatformName(
      //         resp.platform,
      //       )}.`,
      //     );
      //     this.platformForm.setValue({ platform: resp.platform });
      //   },
      //   (err) => {
      //     this.updatePlatformError = `${err.statusText}: ${err.status}`;
      //   },
      // );
    }
  }
}
