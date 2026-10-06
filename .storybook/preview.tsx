import type { Preview } from "@storybook/react-vite"

import { UIProvider } from "@prive-admin-tanstack/ui/provider"

import "../packages/ui/src/styles/globals.css"

const preview: Preview = {
  decorators: [
    (Story) => (
      <UIProvider>
        <Story />
      </UIProvider>
    ),
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
}

export default preview
