# Mantine v9 Migration Design

**Date:** 2026-04-25
**Branch:** `tanstack-rewrite-mantine`
**Reference scaffold:** `/Users/mselvenis/dev/mantinetanstack`

## Goal

Replace the current shadcn/ui + Tailwind v4 styling stack in `prive-admin-tanstack` with Mantine v9, using the `mantinetanstack` reference scaffold as the architectural template. Preserve all existing functionality (routes, server functions, auth, drizzle, queries, locale, timezone, file uploads). No new features. No design polish past Mantine defaults.

## Constraints

- **No custom styles.** Use default Mantine presets only (no custom color palette, no custom theme overrides).
- **Functional parity, Mantine-native look.** Components map to their closest Mantine equivalents; layout stays semantically the same; spacing/sizing uses Mantine defaults; no Tailwind utility classes survive.
- **Color scheme:** `defaultColorScheme="auto"` with a user-toggleable light/dark switch in the header.
- **Migrate everything.** No untouched stubs; every shadcn/Tailwind reference is removed.

## Non-goals

- Server functions, drizzle schema, router config, Better-Auth wiring, query key factory, business logic — all unchanged.
- New automated tests. Manual click-through is the verification.
- Pixel-faithful reproduction of the current visual design.

## Library swaps

| Current | New |
|---|---|
| `lucide-react` | `@tabler/icons-react` |
| `@tanstack/react-form` | `@mantine/form` + `mantine-form-zod-resolver` |
| `sonner` | `@mantine/notifications` |
| `next-themes` | Mantine `ColorSchemeScript` + `useMantineColorScheme` |
| `tailwindcss` + `@tailwindcss/vite` + `tw-animate-css` | `postcss-preset-mantine` + `postcss-simple-vars` |
| `shadcn` + `@base-ui/react` + `class-variance-authority` + `clsx` + `tailwind-merge` | dropped — Mantine ships its own primitives |

## Architecture

### `packages/ui` — tiny Mantine wrapper

The UI package becomes a thin shell matching the reference scaffold. It does **not** re-export Mantine primitives; the web app imports those directly from `@mantine/core` etc.

**New files in `packages/ui/src/`:**

- `provider.tsx` — `UIProvider` wraps `MantineProvider` (with `theme` + `defaultColorScheme="auto"`) + `ModalsProvider` + `<Notifications />`.
- `theme.ts` — `export const theme = createTheme({})`. Empty per the "default Mantine presets" rule.
- `color-scheme.tsx` — re-exports `ColorSchemeScript`, `useMantineColorScheme`, `useComputedColorScheme` from `@mantine/core`.
- `index.ts` — barrel for the three above.

**`packages/ui/src/styles/globals.css`** becomes:

```css
@import "@mantine/core/styles.css";
@import "@mantine/notifications/styles.css";
```

**`packages/ui/postcss.config.cjs`** (replaces `postcss.config.mjs`):

```js
module.exports = {
  plugins: {
    "postcss-preset-mantine": {},
    "postcss-simple-vars": {
      variables: {
        "mantine-breakpoint-xs": "36em",
        "mantine-breakpoint-sm": "48em",
        "mantine-breakpoint-md": "62em",
        "mantine-breakpoint-lg": "75em",
        "mantine-breakpoint-xl": "88em",
      },
    },
  },
};
```

**`packages/ui/package.json` exports:**

```json
{
  "./globals.css": "./src/styles/globals.css",
  "./provider": "./src/provider.tsx",
  "./theme": "./src/theme.ts",
  "./color-scheme": "./src/color-scheme.tsx",
  "./postcss.config": "./postcss.config.cjs"
}
```

### `apps/web` — direct Mantine consumer

- `vite.config.ts` — `@tailwindcss/vite` plugin removed; everything else preserved.
- `apps/web/postcss.config.cjs` — new file, identical config to the UI package (Vite needs PostCSS resolved per-app).
- `apps/web/src/index.css` — strip Tailwind directives. Becomes `@import "@prive-admin-tanstack/ui/globals.css";` plus minimal app-level resets only if Mantine doesn't already cover them.
- `apps/web/src/routes/__root.tsx` — replace `next-themes` `ThemeProvider` and sonner `<Toaster>` with `<UIProvider>`. Add `<ColorSchemeScript defaultColorScheme="auto" />` to `<head>`. Drop `className="dark"` on `<html>`. Keep `LocaleProvider`, `getLocale` `beforeLoad`, timezone cookie effect, lazy devtools, `QueryClient` router context, `appCss` link.

The post-migration `__root.tsx` shell:

```tsx
<html lang={locale} suppressHydrationWarning>
  <head>
    <ColorSchemeScript defaultColorScheme="auto" />
    <HeadContent />
  </head>
  <body>
    <LocaleProvider value={{ locale, timeZone }}>
      <UIProvider>
        <Outlet />
      </UIProvider>
    </LocaleProvider>
    <TanStackRouterDevtools position="bottom-left" />
    <Scripts />
  </body>
</html>
```

## Component map

### Primitives (shadcn → Mantine)

| From | To | Notes |
|---|---|---|
| `Button` (default/secondary/outline/ghost/destructive/link) | `@mantine/core` `Button` | Variant map: default→`filled`, secondary→`light`, outline→`outline`, ghost→`subtle`, destructive→`filled color="red"`, link→`Anchor` |
| `Card` + `CardHeader`/`CardTitle`/`CardContent`/`CardDescription`/`CardFooter` | `Card` + `Stack`/`Group`/`Title`/`Text` | Use `Card.Section` for divided sections |
| `Dialog*` | `Modal` + `useDisclosure` | Or `modals.open()` from `@mantine/modals` for simple confirms |
| `DropdownMenu*` | `Menu` (`Menu.Target`, `Menu.Dropdown`, `Menu.Item`, `Menu.Label`, `Menu.Divider`) | |
| `Table*` | `Table` (`Table.Thead`, `Table.Tbody`, `Table.Tr`, `Table.Th`, `Table.Td`) | |
| `Badge` | `Badge` | |
| `Avatar` + `AvatarImage`/`AvatarFallback` | `Avatar` (single component, `name` prop generates fallback) | |
| `Checkbox` | `Checkbox` | |
| `Input` | `TextInput` / `PasswordInput` / `NumberInput` per `type` attr | |
| `Label` | dropped — Mantine inputs have a built-in `label` prop | |
| `Progress` | `Progress` | |
| `Separator` | `Divider` | |
| `Skeleton` | `Skeleton` | |
| `toast()` from sonner | `notifications.show()` from `@mantine/notifications` | error toasts use `color: "red"` |
| `lucide-react` icons | `@tabler/icons-react` | 1:1 lookup; tabler uses `IconX`-prefixed names (e.g. `IconChevronDown`) |
| Tailwind `className` utilities | Mantine props (`p`, `m`, `gap`, `mt`, `c`) or `style` | No tailwind classes survive |

### Forms (TanStack Form → @mantine/form)

| From | To |
|---|---|
| `useForm({ defaultValues, validators, onSubmit })` | `useForm({ initialValues, validate: zodResolver(schema), validateInputOnBlur })` |
| `form.Field` render-prop with `field.handleChange` | `<TextInput {...form.getInputProps("name")} />` |
| `form.handleSubmit()` in JSX | `<form onSubmit={form.onSubmit(handleSubmit)}>` |
| `form.state.canSubmit` / `isSubmitting` | local `useMutation` state controls `loading` prop on submit `Button` |
| async server errors | `form.setFieldError("name", msg)` after mutation rejects |

Affected forms: `sign-in-form.tsx`, `sign-up-form.tsx`, `hair-assigned/create-hair-assigned-dialog.tsx`, `hair-assigned/edit-hair-assigned-dialog.tsx`. Other CRUD pages (customers/appointments/hair-orders) — verify during impl whether they have inline forms.

### Header & color scheme toggle

`header.tsx` gains an `ActionIcon` using `useMantineColorScheme()` + `useComputedColorScheme()` that toggles between `light`/`dark`. Icon: `IconSun`/`IconMoon` from tabler. The standalone `user-menu.tsx` is folded into `header.tsx` (mirrors the reference's "drop standalone user-menu" commit).

### Authenticated shell

`_authenticated/route.tsx` currently has a custom sidebar layout. Migrate to Mantine `AppShell` with `header` and `navbar` slots. Functional parity over pixel parity.

## Dependency changes

| Action | Package | Where |
|---|---|---|
| Remove | `tailwindcss`, `@tailwindcss/vite`, `tw-animate-css` | root catalog + `apps/web` |
| Remove | `shadcn`, `@base-ui/react`, `class-variance-authority`, `clsx`, `tailwind-merge` | `packages/ui` |
| Remove | `lucide-react`, `sonner`, `next-themes` | catalog + `apps/web` + `packages/ui` |
| Remove | `@fontsource-variable/manrope`, `@fontsource-variable/dm-sans`, `@fontsource-variable/playfair-display` | `packages/ui` + `apps/web` (only if unused after migration; verify during impl) |
| Add | `@mantine/core`, `@mantine/hooks`, `@mantine/modals`, `@mantine/notifications` | `packages/ui` (deps) + `apps/web` (deps) |
| Add | `@mantine/form`, `mantine-form-zod-resolver`, `@tabler/icons-react` | `apps/web` |
| Add | `postcss`, `postcss-preset-mantine`, `postcss-simple-vars` | `packages/ui` (devDeps) + `apps/web` (devDeps) |
| Replace | catalog entries for `lucide-react`/`next-themes`/`sonner`/`tailwindcss` | root `package.json` (drop these lines) |

## File inventory

| Action | Path | Count |
|---|---|---|
| Delete | `packages/ui/components.json`, `packages/ui/src/lib/utils.ts`, `packages/ui/src/components/*.tsx` (14), `packages/ui/src/hooks/.gitkeep` | 17 |
| Add | `packages/ui/src/provider.tsx`, `theme.ts`, `color-scheme.tsx`, `index.ts`, `postcss.config.cjs`, `apps/web/postcss.config.cjs` | 6 |
| Rewrite | `packages/ui/package.json`, `packages/ui/src/styles/globals.css` | 2 |
| Rewrite | `apps/web/package.json`, `apps/web/vite.config.ts`, `apps/web/src/index.css`, `apps/web/src/routes/__root.tsx` | 4 |
| Rewrite | `apps/web/src/components/`: `header.tsx`, `user-menu.tsx` (folded into header), `loader.tsx`, `sign-in-form.tsx`, `sign-up-form.tsx`, `file-list.tsx`, `client-date.tsx`, plus `hair-assigned/{create,edit,delete}-hair-assigned-dialog.tsx`, `hair-assigned-table.tsx` | 11 |
| Rewrite | `apps/web/src/routes/`: `index.tsx`, `login.tsx`, `_authenticated/{route,settings,files,files-direct,playground}.tsx`, `customers/{index,$customerId,route}.tsx`, `appointments/{index,$appointmentId,route}.tsx`, `hair-orders/{index,$hairOrderId,route}.tsx` | 14 |
| Rewrite | root `package.json` (catalog) | 1 |

## Migration order

Phased so the build stays green between phases.

1. **Foundation** — root catalog, UI package full rewrite, `apps/web` deps + `vite.config` + `postcss.config.cjs` + `index.css`, `__root.tsx`. After this phase the build compiles against Mantine; downstream component files still import shadcn — those errors are cleared by the next phases.
2. **Shared atoms** — `loader.tsx`, `client-date.tsx`, `header.tsx` (with color-scheme toggle, user-menu folded in).
3. **Auth flow** — `sign-in-form.tsx`, `sign-up-form.tsx`, `routes/login.tsx`, `routes/index.tsx`.
4. **Authenticated shell** — `_authenticated/route.tsx` (sidebar via `AppShell`), then `settings/files/files-direct/playground` + `file-list.tsx`.
5. **CRUD features** — `hair-assigned/*`, then `customers/*`, `appointments/*`, `hair-orders/*`.
6. **Verify** — `bun run check-types`, `bun run check`, `bun run dev:web`, click every route, flip color scheme, open every dialog.

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| TanStack Form → `@mantine/form` is a port, not a swap (async validation, submission state, server errors differ) | Per-form verification in browser; `useMutation` from React Query carries submit state; `form.setFieldError()` carries server errors |
| `ColorSchemeScript` must run before hydration; `LocaleProvider` reads server data | `ColorSchemeScript` stays at top of `<head>`; `LocaleProvider` stays inside `<body>` wrapping `UIProvider` |
| Removing `className="dark"` may surface code that depended on it | Grep for `dark:` after migration; should find zero matches |
| `_authenticated/route.tsx` custom sidebar doesn't auto-match `AppShell` | Map to `AppShell` with `navbar` + `header`; functional parity over pixel parity |
| File upload UI may have specific drag/drop behavior tied to shadcn styles | Default to Mantine `FileButton`; if drag/drop is required, flag adding `@mantine/dropzone` during impl |
| Hydration mismatches | Keep `suppressHydrationWarning` on `<html>` |

## Testing

- `bun run check-types` passes.
- `bun run check` (oxlint + oxfmt) passes.
- `bun run dev:web` boots without runtime errors.
- Manual click-through: login, sign-up, dashboard, sidebar nav, color-scheme toggle, hair-assigned create/edit/delete, file upload, customer/appointment/hair-order detail pages.
- Verify both light and dark color schemes render correctly.
- No new automated tests added (none exist for UI today).

## Out of scope

- Server functions, drizzle schema, router config, Better-Auth, query keys, business logic.
- New features.
- Pixel-faithful visual reproduction.
- New automated tests.
- Migrating any other workspace package (`packages/auth`, `packages/db`, `packages/env`, `packages/api`).
