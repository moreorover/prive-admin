import type { StorybookConfig } from "@storybook/tanstack-react"

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: [],
  framework: {
    name: "@storybook/tanstack-react",
    options: {},
  },
  docs: {
    autodocs: "tag",
  },
}

export default config
