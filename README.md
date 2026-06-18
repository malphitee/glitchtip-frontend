# 🇨🇳 GlitchTip 简体中文 fork

本仓库是 [GlitchTip 前端](https://gitlab.com/glitchtip/glitchtip-frontend)（GitLab 官方）的**简体中文 fork**：在官方基础上增加了中文(`zh`)界面，并能构建出可直接部署的中文镜像 `malphitee/glitchtip-zh`（多架构 amd64+arm64）。

**文档：**
- 用法 / 构建 / 部署到 1Panel → [`zh-l10n/README.md`](./zh-l10n/README.md)
- 官方升级后如何同步处理 → [`zh-l10n/UPGRADE.md`](./zh-l10n/UPGRADE.md)
- 本次中文化实施记录 → [`docs/zh-localization.md`](./docs/zh-localization.md)

**中文化改动**（相对上游）：`src/main.ts`（增加 `zh` locale + 浮动语言切换器）、`src/assets/i18n/messages.zh.json`（中文翻译）、`Dockerfile.zh`、`.github/workflows/build-and-push.yml`、`zh-l10n/`（翻译维护工具与文档）。

上游 = `gitlab.com/glitchtip/glitchtip-frontend`，`git fetch upstream && git merge upstream/master` 可随时同步官方更新。

---

> 以下为上游原始 README（前端开发说明，保留备查）。

[![Gitter](https://badges.gitter.im/GlitchTip/community.svg)](https://gitter.im/GlitchTip/community?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)

<script src="https://liberapay.com/GlitchTip/widgets/button.js"></script>

<noscript><a href="https://liberapay.com/GlitchTip/donate"><img alt="Donate using Liberapay" src="https://liberapay.com/assets/widgets/donate.svg"></a></noscript>

# GlitchTip Frontend

This Angular CLI project is the frontend for GlitchTip, an open source implementation of Sentry bug tracking software. It works with [GlitchTip-Backend](https://gitlab.com/glitchtip/glitchtip-backend).

View our Contributing documentation [here](./CONTRIBUTING.md).

# Developing locally

## Development server

Run `npm start` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

To run a production-like build on a dev server, run `npm run start-prod-no-static` instead.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

To run a production build that works well with glitchtip-backend, run `npm run build-prod`. The build artifacts will be stored in the `dist/` directory. Copy that into the glitchtip-backend folder, run `collectstatic`, serve the backend, and then navigate to `http://localhost:8000`.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end to end tests

We define end to end testing as running both the Django backend and Angular frontend.
We use Cypress to run end to end tests. Be aware the tests will seed the backend codebase with test data.

1. Run the backend server. From the backend repo run `docker-compose up`. Do not enable Stripe.
2. Run the frontend development server `npm start`
3. Run Cypress `npm run cy:open`

# Internationalization (i18n)

[Angular Localize](https://angular.io/guide/i18n-overview) is used to manage i18n in GlitchTip. [ng-extract-i18n-merge](https://github.com/daniel-sc/ng-extract-i18n-merge) is used to update and merge translation files.

## Adding a new language

1. Copy `src/locale/messages.xlf` to `src/locale/messages.CODE.xlf` where CODE is your language code.
2. Edit `angular.json` and your language code and newly created file.

```
  "i18n": {
    "sourceLocale": "en-US",
    "locales": {
      "CODE": {
        "translation": "src/locale/messages.CODE.xlf"
      }
    }
  },

...

  "extract-i18n": {
    "options": {
      "targetFiles": ["../locale/messages.CODE.xlf"]
    }
  },
```

3. Add language code to src/main.ts `const availableLocales = ["en", "CODE"];`
4. Edit the messages.CODE.xlf file. Consider using a tool such as Poedit.
5. Open a [merge request](https://gitlab.com/glitchtip/glitchtip-frontend/-/merge_requests/new).

## Updating message files

`npm run extract-i18n` will update all message files with the latest extracted strings from the code.

To test out locally, run `npm run i18n-create-json`. Ensure that `navigator.language` returns the desired code.

# Marketing Site

The marketing site https://glitchtip.com uses Angular Universal and prioritizes simplicity and minimum requirements. As such, it does not use a static site generator. Code is shared with the frontend.

1. Build the static routes `npm run build-static`. You may check them at `projects/marketing/routes.txt`. Angular Universal will perform SSR for these routes and any known Angular router routes (ones without variables). This script is at `buildStaticSite.ts`.
2. Build the site with SSR: `npm run build-marketing`

For development, run `ng serve --project marketing` but note this will not perform SSR. To test SSR, run the above build command and use `http-server` to view the resulting html and js bundle.

# Contributing

Open an issue and say hello! If you use Sentry as a reference, make sure only to refer to open source Sentry which we forked [here](https://gitlab.com/glitchtip/sentry-open-source). Never copy code nor ideas from Sentry on GitHub as that would violate their proprietary license.
