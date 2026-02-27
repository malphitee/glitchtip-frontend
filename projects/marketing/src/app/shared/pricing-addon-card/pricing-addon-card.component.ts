import { Component, computed, input } from "@angular/core";
import { MatCard } from "@angular/material/card";
import { MatIcon } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { RouterLink } from "@angular/router";

@Component({
  selector: "mkt-pricing-addon-card",
  imports: [MatCard, MatIcon, MatButtonModule, RouterLink],
  template: `
    <mat-card appearance="outlined" class="addon-card">
      <mat-icon class="addon-icon">{{ icon() }}</mat-icon>
      <div class="addon-text">
        <span class="marketing-body-strong">{{ title() }}</span>
        <span class="marketing-caption addon-subtitle">{{ subtitle() }}</span>
      </div>
      @if (isExternal()) {
        <a
          mat-flat-button
          color="primary"
          class="addon-button"
          [href]="buttonUrl()"
        >
          {{ buttonText() }}
        </a>
      } @else {
        <a
          mat-flat-button
          color="primary"
          class="addon-button"
          [routerLink]="routerPath()"
          [fragment]="routerFragment()"
        >
          {{ buttonText() }}
        </a>
      }
    </mat-card>
  `,
  styles: [
    `
      .addon-card {
        display: flex;
        flex-direction: row;
        align-items: center;
        padding: 20px 24px;
        margin-top: 16px;
        gap: 16px;
      }

      .addon-icon {
        font-size: 40px;
        width: 40px;
        height: 40px;
        flex-shrink: 0;
        color: var(--mat-sys-primary);
      }

      .addon-text {
        display: flex;
        flex-direction: column;
        flex: 1;
        gap: 4px;
      }

      .addon-subtitle {
        color: var(--mat-sys-on-surface-variant);
      }

      .addon-button {
        white-space: nowrap;
        flex-shrink: 0;
      }

      @media (max-width: 599px) {
        .addon-card {
          flex-direction: column;
          text-align: center;
        }
      }
    `,
  ],
})
export class PricingAddonCardComponent {
  readonly icon = input.required<string>();
  readonly title = input.required<string>();
  readonly subtitle = input.required<string>();
  readonly buttonText = input.required<string>();
  readonly buttonUrl = input.required<string>();
  readonly isExternal = computed(() => /^https?:\/\/|^mailto:/.test(this.buttonUrl()));
  readonly routerPath = computed(() => this.buttonUrl().split("#")[0]);
  readonly routerFragment = computed(() => this.buttonUrl().split("#")[1]);
}
