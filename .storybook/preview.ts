import { applicationConfig, componentWrapperDecorator, moduleMetadata, type Preview } from "@storybook/angular";
import "@angular/localize/init";
import { MatIconRegistry } from "@angular/material/icon";
import { Component } from "@angular/core";


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
      providers: [],
    }),
    moduleMetadata({
      imports: [ParentComponent]
    }),
    componentWrapperDecorator(ParentComponent),
  ],
};

export default preview;
