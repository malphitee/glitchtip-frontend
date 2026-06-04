import {
  Component,
  ChangeDetectionStrategy,
  computed,
  signal,
} from "@angular/core";
import { NgComponentOutlet } from "@angular/common";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatListModule } from "@angular/material/list";
import { MatButtonToggleModule } from "@angular/material/button-toggle";
import { MatIconModule } from "@angular/material/icon";
import { PREVIEWS, PreviewEntry, groupedPreviews } from "./registry";

type ThemeMode = "system" | "light" | "dark";

@Component({
  selector: "preview-root",
  imports: [
    NgComponentOutlet,
    MatToolbarModule,
    MatListModule,
    MatButtonToggleModule,
    MatIconModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./app.component.html",
})
export class AppComponent {
  readonly groups = groupedPreviews();
  readonly selectedId = signal<string>(PREVIEWS[0]?.id ?? "");
  readonly theme = signal<ThemeMode>("system");

  readonly selected = computed<PreviewEntry | undefined>(() =>
    PREVIEWS.find((p) => p.id === this.selectedId()),
  );

  readonly canvasThemeClass = computed(
    () => `preview-canvas--${this.theme()}`,
  );

  select(id: string): void {
    this.selectedId.set(id);
  }

  setTheme(mode: ThemeMode): void {
    this.theme.set(mode);
  }
}
