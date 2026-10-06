import type { StorybookConfig } from "@storybook/react-vite"

import { fileURLToPath } from "node:url"
import { mergeConfig } from "vite"

const config: StorybookConfig = {
  stories: ["../apps/web/src/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-a11y"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  viteFinal: async (viteConfig) =>
    mergeConfig(viteConfig, {
      resolve: {
        alias: {
          "@": fileURLToPath(new URL("../apps/web/src", import.meta.url)),
          "@prive-admin-tanstack/ui": fileURLToPath(new URL("../packages/ui/src", import.meta.url)),
        },
      },
    }),
}

export default config
