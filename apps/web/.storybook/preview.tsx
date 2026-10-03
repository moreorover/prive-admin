import type { Preview } from "@storybook/tanstack-react"

import { UIProvider } from "@prive-admin-tanstack/ui/provider"
import "@prive-admin-tanstack/ui/globals.css"

import { BreadcrumbProvider } from "../src/components/breadcrumbs"

const preview: Preview = {
  decorators: [
    (Story) => (
      <UIProvider>
        <BreadcrumbProvider>
          <Story />
        </BreadcrumbProvider>
      </UIProvider>
    ),
  ],
  parameters: {
    layout: "padded",
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  tags: ["autodocs"],
}

export default preview
