import { Component, ChangeDetectionStrategy, inject } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { RouterLink } from "@angular/router";
import { EmailVerificationService } from "src/app/api/email-verification/email-verification.service";

@Component({
  selector: "gt-verify-email-banner",
  imports: [MatCardModule, MatButtonModule, MatProgressSpinnerModule, RouterLink],
  templateUrl: "./verify-email-banner.component.html",
  styleUrls: ["./verify-email-banner.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerifyEmailBannerComponent {
  readonly emailVerification = inject(EmailVerificationService);

  onResend() {
    this.emailVerification.resendVerification();
  }

  onRefresh() {
    this.emailVerification.refresh();
  }
}
