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

    // Clean iOS/Cocoa paths to show only meaningful parts
    if (
      displayValue &&
      (effectivePlatform === "cocoa" || effectivePlatform === "objc")
    ) {
      displayValue = this.cleanIosPath(displayValue);
    }

    return displayValue;
  }

  /**
   * Strips unnecessary path prefixes from iOS/Cocoa paths to show only meaningful parts.
   * Examples:
   *   /Users/.../CoreSimulator/.../ErrorFactory.app/ErrorFactory.debug.dylib -> ErrorFactory.app/ErrorFactory.debug.dylib
   *   /System/Library/Frameworks/UIKit.framework/UIKit -> UIKit.framework/UIKit
   */
  private cleanIosPath(path: string): string {
    // Extract from .app bundle onwards
    const appMatch = path.match(/([^\/]+\.app\/.+)$/);
    if (appMatch) {
      return appMatch[1];
    }

    // Extract framework name and file
    const frameworkMatch = path.match(/([^\/]+\.framework\/.+)$/);
    if (frameworkMatch) {
      return frameworkMatch[1];
    }

    // Extract dylib name
    const dylibMatch = path.match(/([^\/]+\.dylib)$/);
    if (dylibMatch) {
      return dylibMatch[1];
    }

    // For system libraries, show just the last meaningful part
    const parts = path.split("/");
    if (parts.length > 2) {
      // Keep last 2-3 parts if no special extension found
      return parts.slice(-2).join("/");
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

  /**
   * Cleans package paths for display, applying platform-specific logic
   */
  cleanPackagePath(packagePath: string, framePlatform: string | null): string {
    const effectivePlatform = this.eventPlatform() || framePlatform;

    if (effectivePlatform === "cocoa" || effectivePlatform === "objc") {
      return this.cleanIosPath(packagePath);
    }

    return packagePath;
  }

  /**
   * Checks if the frame is from an iOS/Cocoa platform
   */
  isIosPlatform(framePlatform: string | null): boolean {
    const effectivePlatform = this.eventPlatform() || framePlatform;
    return effectivePlatform === "cocoa" || effectivePlatform === "objc";
  }

  /**
   * Checks if a function name is a mangled Swift name that should be hidden.
   * Swift mangled names start with $s or _$s and are not human-readable.
   */
  isMangledSwiftName(
    functionName: string | null,
    framePlatform: string | null,
  ): boolean {
    if (!functionName) {
      return false;
    }

    const effectivePlatform = this.eventPlatform() || framePlatform;
    const isIos = effectivePlatform === "cocoa" || effectivePlatform === "objc";

    // Only hide mangled names for iOS platforms
    if (!isIos) {
      return false;
    }

    // Swift mangled names start with $s or _$s
    return functionName.startsWith("$s") || functionName.startsWith("_$s");
  }
}
