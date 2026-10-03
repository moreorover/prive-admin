import { storybookTest } from "@storybook/addon-vitest/vitest-plugin"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { defineConfig, mergeConfig } from "vite-plus"
import { playwright } from "vite-plus/test/browser-playwright"

import viteConfig from "./vite.config"

const dirname = path.dirname(fileURLToPath(import.meta.url))

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      projects: [
        {
          extends: true,
          plugins: [
            storybookTest({
              configDir: path.join(dirname, ".storybook"),
              storybookScript: "vp run --filter web storybook -- --no-open",
            }),
          ],
          test: {
            name: "storybook",
            browser: {
              enabled: true,
              provider: playwright({}),
              headless: true,
              instances: [{ browser: "chromium" }],
            },
          },
        },
      ],
    },
  }),
)
