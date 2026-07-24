<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, lint, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.
- [ ] If setup, runtime, or package-manager behavior looks wrong, run `vp env doctor` and include its output when asking for help.

<!--VITE PLUS END-->

## API Governance

Backend capability must be modeled first as an application service in `packages/application/src/services`.

tRPC routers are transport adapters, not UI-specific backend-for-frontend endpoints. New procedures should be named around domain resources and stable use cases, usually `list`, `get`, `create`, `update`, `delete`, or domain verbs such as `assign`, `unassign`, `importCsv`, and `recalculatePrices`.

Collection reads should use a single `list` procedure with resource-oriented filters instead of separate procedures for each filtered subset. List procedures must return the standard paged response envelope and use the backend default `pageSize` of 10 when the caller does not provide one.

Do not add procedures named after pages, components, drawers, tabs, or UI workflows unless the same use case is first modeled as an application service and the API naming is reviewed.

Do not create REST/Hono adapters solely to satisfy this rule. Keep using tRPC for the internal web app unless a task explicitly asks for REST endpoints or HTTP-specific behavior such as uploads, downloads, redirects, streaming, caching semantics, or third-party integration.

## Frontend Data Ownership

Components must not initiate server reads or mutations. This applies to shared components and route-private `-components`.

Route files and route/page owner modules own server state. Start read queries in TanStack Router loaders when data is needed for route rendering, and use `queryClient.ensureQueryData` or `prefetchQuery` for preload. Put reusable query option builders in route-local `-data` modules when helpful.

Start mutations in route/page owners and pass explicit event handlers such as `onCreate`, `onUpdate`, `onDelete`, or `onSubmit` into child components. Pass data, loading state, and error-display state as props when components need to render pending or failure UI. Mutation side effects such as cache invalidation, navigation, notifications, route refreshes, and dialog close/reset behavior belong in the route/page owner.

Add or update architecture tests when introducing route/component structure so `useQuery`, `useMutation`, and route action hooks stay out of component files.

## PR Titles

Use a conventional-commits PR title when opening or editing PRs. Allowed types are `feat`, `fix`, `chore`, `ci`, `docs`, `refactor`, `perf`, `test`, `build`, `style`, and `revert`. Scope is optional, and the subject must start with a letter.
