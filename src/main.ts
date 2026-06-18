import {
  ErrorHandler,
  inject,
  provideZonelessChangeDetection,
  Provider,
} from "@angular/core";
import { loadTranslations } from "@angular/localize";

import { AppComponent } from "./app/app.component";
import { provideMicroSentry } from "@micro-sentry/angular";
import { MAT_SNACK_BAR_DEFAULT_OPTIONS } from "@angular/material/snack-bar";
import { MAT_CARD_CONFIG } from "@angular/material/card";
import { routes, TemplatePageTitleStrategy } from "./app/app.routes";
import { bootstrapApplication } from "@angular/platform-browser";
import { LessAnnoyingErrorStateMatcher } from "./app/shared/less-annoying-error-state-matcher";
import { ErrorStateMatcher } from "@angular/material/core";
import { CustomMicroSentryErrorHandler } from "./app/custom-microsentry-error-handler";
import {
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
  provideHttpClient,
  withInterceptors,
  withXhr,
} from "@angular/common/http";
import {
  provideRouter,
  TitleStrategy,
  withComponentInputBinding,
  withInMemoryScrolling,
  withPreloading,
  withRouterConfig,
} from "@angular/router";
import { CustomPreloadingStrategy } from "./app/preloadingStrategy";
import { APP_BASE_HREF } from "@angular/common";
import { provideAnimationsAsync } from "@angular/platform-browser/animations/async";

let snackBarDuration = 4000;
if (window.Cypress) {
  // Speed up cypress tests
  snackBarDuration = 100;
}
const serverErrorsRegex = new RegExp(`403 Forbidden|404 OK`, "mi");

// First locale is default, add additional after it
const availableLocales = ["en", "fr", "nb", "zh"];
// Direct macrolanguages to specific ones. Example: Norwegian becomes Bokmål
const localeMappings: { [key: string]: string } = { no: "nb" };

// zh fork: 优先使用用户在语言切换器里选择的语言（存于 localStorage），其次浏览器语言
const savedLocale = localStorage.getItem("locale");
let locale =
  (savedLocale && availableLocales.includes(savedLocale) && savedLocale) ||
  availableLocales.find((l) => navigator.language.startsWith(l)) ||
  availableLocales[0];
window.document.documentElement.lang = locale;

if (locale in localeMappings) {
  locale = localeMappings[locale];
}

export function baseHrefInterceptor(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
) {
  const baseHref = inject(APP_BASE_HREF);
  const apiReq = req.clone({ url: `${baseHref.replace(/\/$/, "")}${req.url}` });
  return next(apiReq);
}

const extraInterceptors: HttpInterceptorFn[] = [];
const extraProviders: Provider[] = [];

const baseElement = document.querySelector("base");
if (baseElement) {
  const baseHref = baseElement.href;
  // Only add base href support when it's not "/"
  if (baseHref !== "/") {
    extraProviders.push({ provide: APP_BASE_HREF, useValue: baseHref });
    extraInterceptors.push(baseHrefInterceptor);
  }
}

const bootstrap = () =>
  bootstrapApplication(AppComponent, {
    providers: [
      ...extraProviders,
      provideZonelessChangeDetection(),
      provideAnimationsAsync(), // ng-charts uses this, should be removed
      provideRouter(
        routes,
        withComponentInputBinding(),
        withPreloading(CustomPreloadingStrategy),
        withInMemoryScrolling({
          scrollPositionRestoration: "enabled",
        }),
        withRouterConfig({
          onSameUrlNavigation: "reload",
          paramsInheritanceStrategy: "always",
        }),
      ),
      provideHttpClient(withXhr(), withInterceptors([...extraInterceptors])),
      provideMicroSentry({
        ignoreErrors: [serverErrorsRegex],
      }),
      {
        provide: MAT_SNACK_BAR_DEFAULT_OPTIONS,
        useValue: { duration: snackBarDuration },
      },
      {
        provide: MAT_CARD_CONFIG,
        useValue: { appearance: "outlined" },
      },
      { provide: ErrorHandler, useClass: CustomMicroSentryErrorHandler },
      { provide: TitleStrategy, useClass: TemplatePageTitleStrategy },
      {
        provide: ErrorStateMatcher,
        useClass: LessAnnoyingErrorStateMatcher,
      },
    ],
  }).catch((err) => console.error(err));

if (locale === availableLocales[0]) {
  bootstrap();
} else {
  // fetch resources for runtime translations. this could also point to an API endpoint
  fetch(`static/assets/i18n/messages.${locale}.json`)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      return response.json();
    })
    .then((result) => {
      loadTranslations(result);

      bootstrap();
    });
}

// zh fork: 注入一个独立的语言切换器（不依赖任何 Angular 组件，跟随上游升级几乎无冲突）。
// 选中后写入 localStorage 并刷新页面；刷新后上面的逻辑会按所选语言加载翻译。
function mountLanguageSwitcher(current: string) {
  const labels: { [code: string]: string } = {
    en: "English",
    fr: "Français",
    nb: "Norsk",
    zh: "中文",
  };
  const select = document.createElement("select");
  select.setAttribute("aria-label", "Language");
  select.style.cssText =
    "position:fixed;right:12px;bottom:12px;z-index:9999;" +
    "font:13px system-ui,sans-serif;color:inherit;cursor:pointer;opacity:.55;" +
    "padding:4px 8px;border:1px solid rgba(127,127,127,.5);border-radius:6px;" +
    "background:rgba(127,127,127,.12);transition:opacity .2s;";
  select.onmouseenter = () => (select.style.opacity = "1");
  select.onmouseleave = () => (select.style.opacity = ".55");
  for (const code of availableLocales) {
    const opt = document.createElement("option");
    opt.value = code;
    opt.textContent = "🌐 " + (labels[code] ?? code);
    opt.selected = code === current;
    select.appendChild(opt);
  }
  select.addEventListener("change", () => {
    localStorage.setItem("locale", select.value);
    location.reload();
  });
  const mount = () => document.body.appendChild(select);
  if (document.body) {
    mount();
  } else {
    addEventListener("DOMContentLoaded", mount);
  }
}

if (!window.Cypress) {
  mountLanguageSwitcher(locale);
}
