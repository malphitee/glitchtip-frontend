Install the sentry Angular SDK:

```bash
npm install @sentry/angular
```

Initialize the SDK in your `main.ts` **before** bootstrapping the app:

```typescript
import { ErrorHandler } from "@angular/core";
import { bootstrapApplication } from "@angular/platform-browser";
import * as Sentry from "@sentry/angular";
import { AppComponent } from "./app/app.component";

Sentry.init({
  dsn: "YOUR_DSN",
  tracesSampleRate: 0.01, // 1% of transactions — adjust to your needs
  autoSessionTracking: false, // GlitchTip does not support sessions
});

bootstrapApplication(AppComponent, {
  providers: [
    { provide: ErrorHandler, useValue: Sentry.createErrorHandler() },
  ],
});
```

Providing `Sentry.createErrorHandler()` as the Angular `ErrorHandler` ensures component errors are captured automatically.

Verify your setup by throwing an error in any component:

```typescript
throw new Error("Test GlitchTip error");
```

## Source Maps

Upload source maps for readable stack traces. Use the [GlitchTip CLI](/documentation/cli):

```bash
glitchtip-cli sourcemaps inject ./dist
glitchtip-cli sourcemaps upload ./dist --org my-org --project my-project
```

## Tips

- Set `tracesSampleRate` to a low value in production to save disk space.
- Use `release` and `environment` options to track which deployments introduce errors.
