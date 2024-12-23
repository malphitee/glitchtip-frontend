import { applicationConfig, componentWrapperDecorator, moduleMetadata, type Preview } from "@storybook/angular";
import "@angular/localize/init";
import { MatIconRegistry } from "@angular/material/icon";
import { Component } from "@angular/core";
import { provideRouter } from "@angular/router";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";
import { provideMicroSentry } from "@micro-sentry/angular";


@Component({
  selector: "parent",
  template: `<ng-content></ng-content>`,
})
class ParentComponent {
  constructor(private matIconRegistry: MatIconRegistry) {
    this.matIconRegistry.setDefaultFontSetClass("material-symbols-outlined");
  }
}

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: [
    applicationConfig({
      providers: [provideHttpClient(), provideMicroSentry({}), provideHttpClientTesting(), provideRouter([]),],
    }),
    moduleMetadata({
      imports: [ParentComponent]
    }),
    componentWrapperDecorator(ParentComponent),
  ],
};

export default preview;
