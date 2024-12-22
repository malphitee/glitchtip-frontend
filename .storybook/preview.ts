import { applicationConfig, type Preview } from "@storybook/angular";
import "@angular/localize/init";

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
  ],
};

export default preview;
