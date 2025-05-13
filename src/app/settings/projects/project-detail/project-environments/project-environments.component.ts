import {
  Component,
  ChangeDetectionStrategy,
  OnDestroy,
  inject,
} from "@angular/core";
import { ProjectEnvironmentsService } from "./project-environments.service";
import { LoadingButtonComponent } from "../../../../shared/loading-button/loading-button.component";
import { MatListModule } from "@angular/material/list";
import { MatDividerModule } from "@angular/material/divider";
import { MatCardModule } from "@angular/material/card";

@Component({
  selector: "gt-project-environments",
  templateUrl: "./project-environments.component.html",
  styleUrls: ["./project-environments.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCardModule,
    MatDividerModule,
    MatListModule,
    LoadingButtonComponent,
  ],
})
export class ProjectEnvironmentsComponent implements OnDestroy {
  private environmentsService = inject(ProjectEnvironmentsService);

  initialLoad = this.environmentsService.initialLoad;
  toggleHiddenloading = this.environmentsService.toggleHiddenLoading;
  sortedEnvironments = this.environmentsService.sortedEnvironments;

  ngOnDestroy(): void {
    this.environmentsService.clearState();
  }

  toggleHidden(environment: any) {
    this.environmentsService.updateEnvironment({
      ...environment,
      isHidden: !environment.isHidden,
    });
  }
}
