import { Component, PLATFORM_ID, inject, signal } from "@angular/core";
import { isPlatformBrowser } from "@angular/common";
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatCard } from "@angular/material/card";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatIcon } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { RouterLink } from "@angular/router";

const SUPPORT_EMAIL = "sales@glitchtip.com";
const LICENSE_KEY_FRAGMENT = /^#?(sub_[A-Za-z0-9]+)$/;
const APP_URL = "https://app.glitchtip.com";

@Component({
  selector: "mkt-support",
  imports: [
    MatCard,
    MatButtonModule,
    MatFormFieldModule,
    MatIcon,
    MatInputModule,
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: "./support.component.html",
  styleUrls: ["./support.component.scss"],
})
export class SupportComponent {
  private platformId = inject(PLATFORM_ID);

  protected licenseKeyFromUrl = signal<string | null>(null);
  protected appUrl = APP_URL;

  protected contactForm = new FormGroup({
    email: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    message: new FormControl("", {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(10)],
    }),
  });

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const match = window.location.hash.match(LICENSE_KEY_FRAGMENT);
      if (match) {
        this.licenseKeyFromUrl.set(match[1]);
      }
    }
  }

  composeSupportEmail() {
    if (this.contactForm.invalid) return;
    const { email, message } = this.contactForm.value;
    const key = this.licenseKeyFromUrl();
    const subject = key ? `Support Request - ${key}` : "Support Request";
    const bodyLines = [message ?? "", "", "--", `From: ${email ?? ""}`];
    if (key) bodyLines.push(`License key: ${key}`);
    const body = bodyLines.join("\n");
    const mailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
  }
}
