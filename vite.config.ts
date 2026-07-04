import { defineConfig } from "vite-plus"

export default defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  fmt: {
    printWidth: 120,
    semi: false,
    experimentalSortImports: {
      groups: [
        "type-import",
        ["value-builtin", "value-external"],
        "type-internal",
        "value-internal",
        ["type-parent", "type-sibling", "type-index"],
        ["value-parent", "value-sibling", "value-index"],
        "unknown",
      ],
    },
    experimentalTailwindcss: {
      stylesheet: "./apps/web/src/index.css",
      functions: ["clsx", "cn"],
      preserveWhitespace: true,
    },
    experimentalSortPackageJson: {
      sortScripts: false,
    },
    ignorePatterns: [".agents", "**/*.html", "docs", "routeTree.gen.ts", "packages/db/src/migrations"],
  },
  lint: {
    rules: {
      "vite-plus/prefer-vite-plus-imports": "error",
    },
    env: {
      builtin: true,
    },
    globals: {},
    ignorePatterns: [".agents", "**/*.html", "docs", "routeTree.gen.ts", "packages/db/src/migrations"],
    jsPlugins: [
      {
        name: "vite-plus",
        specifier: "vite-plus/oxlint-plugin",
      },
    ],
  },
})
