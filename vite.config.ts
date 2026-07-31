import { defineConfig } from "vite-plus"

export default defineConfig({
  resolve: {
    alias: {
      "@": new URL("./apps/web/src", import.meta.url).pathname,
    },
  },
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
    plugins: ["typescript", "unicorn"],
    rules: {
      "vite-plus/prefer-vite-plus-imports": "error",
    },
    overrides: [
      {
        files: ["**/*.test.ts", "**/*.test.tsx"],
        plugins: ["typescript", "unicorn", "vitest"],
      },
      {
        files: ["apps/web/**", "packages/ui/**"],
        plugins: ["typescript", "unicorn", "react", "jsx-a11y"],
      },
      {
        files: [
          "apps/web/**/*.test.ts",
          "apps/web/**/*.test.tsx",
          "packages/ui/**/*.test.ts",
          "packages/ui/**/*.test.tsx",
        ],
        plugins: ["typescript", "unicorn", "react", "jsx-a11y", "vitest"],
      },
    ],
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
  test: {
    include: ["{apps,packages}/**/src/**/*.test.{ts,tsx}"],
    exclude: ["**/dist/**", "**/node_modules/**", ".worktrees/**"],
  },
})
