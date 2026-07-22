# Route Folder Organization Design

## Goal

Refactor every TanStack Router route directory so route-local data, mutations, and page-local components follow the same folder convention:

```txt
-data/
-actions/
-components/
```

Only create a folder when that route directory has files for that concern. Do not add empty folders.

## Background

Recent route refactors already moved the web app toward thin route files:

- Public route files should not contain custom page components.
- Authenticated route files should not orchestrate mutations.
- Reusable components should not initiate server reads or writes.
- Route loaders should preload server data with TanStack Query through `queryClient.ensureQueryData`.

The remaining inconsistency is file placement. Some route directories keep route-local helpers as flat `-index-data.ts`, `-foo-actions.ts`, and `-page.tsx` files. As routes grow, especially nested authenticated resources, those flat files become harder to scan. This refactor standardizes the structure while preserving route ownership.

## Target Structure

Each route directory keeps TanStack Router route files at the route root:

```txt
route.tsx
index.tsx
$resourceId.tsx
```

Route-local support files move into ignored helper folders:

```txt
-data/
  index-data.ts
  detail-data.ts
-actions/
  resource-actions.ts
-components/
  resource-page.tsx
  resource-table.tsx
```

Example target for documents:

```txt
routes/_authenticated/documents/
  route.tsx
  index.tsx
  -data/
    index-data.ts
  -actions/
    document-actions.ts
  -components/
    documents-page.tsx
    documents-table.tsx
```

Folders are concern-based and route-local. A route directory with only a page component gets `-components/` only. A route directory with only query option factories gets `-data/` only. A route directory with no local helpers stays unchanged.

## Route File Responsibilities

Route files remain thin TanStack Router contract adapters. They may contain:

- `createFileRoute` or `createRootRouteWithContext`
- `validateSearch`
- `loaderDeps`
- `beforeLoad`
- `loader`
- redirects and not-found handling
- `component`, `pendingComponent`, `errorComponent`, or related route configuration
- imports from route-local `-data`, `-actions`, and `-components` folders

Route files should not define custom page components, tables, forms, drawers, panels, domain mappers, mutation hooks, or reusable UI helpers.

## Data Folder Responsibilities

`-data/` contains route-owned server read definitions and URL state helpers:

- search schemas
- search-param types
- page-size constants
- query option factory functions
- route-local data shaping helpers that are needed by loaders and page components
- route-local hooks that combine several `useQuery` calls for the owning page

Query option factories should be exported and reused by both loaders and components where possible. Loader code should continue to use `queryClient.ensureQueryData(...)` rather than direct tRPC calls or `prefetchQuery`.

The app already uses tRPC's TanStack Query options proxy, so this design does not introduce a separate manual query-key factory. Generated tRPC query keys remain the source of truth for reads and invalidation.

## Actions Folder Responsibilities

`-actions/` contains route-owned mutation orchestration:

- hooks wrapping `useMutation`
- route-specific cache invalidation
- route-specific optimistic update or rollback logic if added later
- route-specific notification side effects

Reusable components should receive mutation handlers and pending/error state as props. Mutation side effects such as invalidation, navigation, notifications, and dialog reset/close behavior remain in route/page owners.

## Components Folder Responsibilities

`-components/` contains components owned by a route directory:

- page components
- page-local tables
- page-local drawers and dialogs
- page-local forms
- route-only layout fragments

Components in `-components/` may call route-owned data hooks or action hooks when they are page owners for that route. Components intended for reuse across unrelated routes should remain in `apps/web/src/components` and should not call `useQuery` or `useMutation`.

## Shared Component Boundary

`apps/web/src/components` remains for reusable, server-state-free UI. Those components should receive:

- data or view-ready options as props
- event handlers such as `onCreate`, `onUpdate`, `onDelete`, or `onSubmit`
- loading and error-display state as props when needed

They should not initiate route data fetching or mutate server data directly.

## Testing And Enforcement

Update the existing organization tests so they enforce the new structure:

- Route files should not contain custom components.
- Authenticated route files should not contain mutation orchestration.
- `apps/web/src/components` should not contain `useQuery` or `useMutation`.
- Route-local helper files should live under `-data/`, `-actions/`, or `-components/` instead of as flat `-*.ts` or `-*.tsx` files, except for existing organization test files and other explicitly route-ignored test files.

Validation should include:

- targeted organization tests during the refactor
- `vp check`
- `vp test` when the full route migration is complete

## Non-Goals

This refactor does not change backend API procedure names, application services, repositories, schemas, route URLs, visual design, or user-visible behavior.

This refactor does not introduce feature-level folders such as `src/features/*`. Route directories remain the ownership boundary for page-specific data, actions, and components.

This refactor does not add empty folder placeholders.

## Migration Strategy

Migrate route directories incrementally but complete the convention across the full route tree before finishing:

1. Add or update guard tests so the desired structure is visible before moving production files.
2. Move root-level route helpers into `-data/`, `-actions/`, and `-components/`.
3. Move nested route helpers using the same convention.
4. Split large route page files into page and local subcomponents when they already contain multiple local components.
5. Update imports after each route directory migration.
6. Run targeted tests frequently, then run the full project validation.

Because this is a structural refactor, behavior should remain unchanged. Any behavior change discovered during migration should be treated as a bug unless explicitly approved separately.
