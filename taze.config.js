import { defineConfig } from "taze"

export default defineConfig({
  githubActions: {
    style: "auto",
  },
  fastNpmMetaApiEndpoint: "https://npm.antfu.dev/",
  maturityPeriod: 7,
  maturityPeriodExclude: ["@mantine/*", "better-auth"],
})
