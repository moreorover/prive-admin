import { defineConfig } from "taze"

export default defineConfig({
  githubActions: {
    style: "auto",
  },
  fastNpmMetaApiEndpoint: "https://npm.antfu.dev/",
  includeLocked: true,
  maturityPeriod: 7,
})
