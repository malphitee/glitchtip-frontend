import {
  Component,
  ChangeDetectionStrategy,
  Input,
  input,
} from "@angular/core";
import type { Frame } from "src/app/issues/interfaces";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatTooltipModule } from "@angular/material/tooltip";

@Component({
  selector: "gt-frame-title",
  templateUrl: "./frame-title.component.html",
  styleUrl: "./frame-title.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatTooltipModule, MatButtonModule, MatIconModule],
})
export class FrameTitleComponent {
  @Input() frame: Frame | undefined;
  readonly eventPlatform = input<string | null>();

  /** Show a tool tip with the absPath if it doesn't match filename or module */
  showToolTip(
    absPath: string | null,
    filename: string | null,
    module: string | null,
  ): string {
    if ((absPath && absPath !== filename) || (absPath && absPath !== module)) {
      return absPath;
    } else {
      return "";
    }
  }

  // tslint:disable-next-line: max-line-length
  // Credit: Sentry https://gitlab.com/glitchtip/sentry-open-source/sentry/-/blob/master/src/sentry/static/sentry/app/components/events/interfaces/frame.jsx#L136
  displayFilenameOrModule(
    platform: string | null,
    filename: string | null,
    module: string | null,
  ): string | undefined {
    const effectivePlatform = this.eventPlatform() || platform;
    let displayValue: string | undefined;

    switch (effectivePlatform) {
      case "java":
      case "csharp":
        displayValue = module ? module : filename ? filename : undefined;
        break;
      default:
        displayValue = filename ? filename : module ? module : undefined;
    }

    if (displayValue && this.isIosPlatform(platform)) {
      displayValue = this.cleanIosPath(displayValue);
    }

    return displayValue;
  }

  private cleanIosPath(path: string): string {
    const appMatch = path.match(/([^\/]+\.app\/.+)$/);
    if (appMatch) {
      return appMatch[1];
    }

    const frameworkMatch = path.match(/([^\/]+\.framework\/.+)$/);
    if (frameworkMatch) {
      return frameworkMatch[1];
    }

    return path;
  }

  isUrl(str: string | null): boolean {
    if (str) {
      return /^https?:/.test(str);
    } else {
      return false;
    }
  }

  sanitizeUrl(url: string): string | null {
    if (url === "about:blank") {
      return null;
    }
    return url;
  }

  cleanPackagePath(packagePath: string, framePlatform: string | null): string {
    if (this.isIosPlatform(framePlatform)) {
      return this.cleanIosPath(packagePath);
    }

    return packagePath;
  }

  isIosPlatform(framePlatform: string | null): boolean {
    const effectivePlatform = this.eventPlatform() || framePlatform;
    return effectivePlatform === "cocoa" || effectivePlatform === "objc";
  }

  isMangledSwiftName(
    functionName: string | null,
    framePlatform: string | null,
  ): boolean {
    if (!functionName) {
      return false;
    }

    if (!this.isIosPlatform(framePlatform)) {
      return false;
    }

    return functionName.startsWith("$s") || functionName.startsWith("_$s");
  }
}
