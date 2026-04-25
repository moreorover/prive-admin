# Mantine v9 Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace shadcn/Tailwind with Mantine v9 across `apps/web` and `packages/ui`, preserving all functionality (auth, drizzle, queries, locale, file uploads). No custom styles — default Mantine presets only.

**Architecture:** `packages/ui` becomes a thin Mantine wrapper (provider + theme + color-scheme exports). `apps/web` consumes Mantine packages directly. Library swaps: `lucide-react` → `@tabler/icons-react`, `@tanstack/react-form` → `@mantine/form` + `mantine-form-zod-resolver`, `sonner` → `@mantine/notifications`, `next-themes` → Mantine `ColorSchemeScript`. `tailwindcss` + shadcn primitives are removed.

**Tech Stack:** TanStack Start, TanStack Router, TanStack Query (kept), Mantine v9 (added), Better-Auth (kept), Drizzle (kept), Bun, Turborepo, oxlint/oxfmt.

**Spec:** `docs/superpowers/specs/2026-04-25-mantine-v9-migration-design.md`. **Reference scaffold:** `/Users/mselvenis/dev/mantinetanstack`.

**Branch:** `tanstack-rewrite-mantine` (already on it). All commits go on this branch.

**Cycle per task** (no UI tests exist; we use type-check + manual verification):
1. Make change.
2. Run `bun run check-types` from repo root.
3. Optionally run `bun run dev:web` and click affected route.
4. Run `bun run check` (oxlint + oxfmt).
5. Commit.

**Important:** During Phase 1, `check-types` will fail in `apps/web` because the consumer files still import shadcn paths that no longer exist. That's expected; phases 2–5 clear those errors. Phase 1 commits should still pass `check-types` for the **UI package** itself. Don't fix consumer errors during Phase 1.

---

## Phase 1 — Foundation

### Task 1: Update root catalog

**Files:**
- Modify: `package.json` (root)

- [ ] **Step 1: Drop shadcn/tailwind catalog entries**

In `package.json` at repo root, remove these lines from `workspaces.catalog`:
- `"lucide-react": "^1.7.0",`
- `"next-themes": "^0.4.6",`
- `"sonner": "^2.0.7",`
- `"tailwindcss": "^4.2.2",`

Final catalog should be:

```json
"catalog": {
  "dotenv": "^17.3.1",
  "zod": "^4.3.6",
  "@types/node": "^25.5.0",
  "react": "^19.2.4",
  "react-dom": "^19.2.4",
  "better-auth": "1.5.5",
  "@types/react": "^19.2.14",
  "@types/react-dom": "^19.2.3"
}
```

- [ ] **Step 2: Commit**

```bash
git add package.json
git commit -m "chore: drop tailwind/shadcn deps from root catalog"
```

---

### Task 2: Replace UI package package.json + delete shadcn artifacts

**Files:**
- Modify: `packages/ui/package.json`
- Delete: `packages/ui/components.json`, `packages/ui/src/lib/utils.ts`, all of `packages/ui/src/components/`, `packages/ui/src/hooks/`

- [ ] **Step 1: Replace `packages/ui/package.json` with Mantine deps**

Full contents:

```json
{
  "name": "@prive-admin-tanstack/ui",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "exports": {
    "./globals.css": "./src/styles/globals.css",
    "./provider": "./src/provider.tsx",
    "./theme": "./src/theme.ts",
    "./color-scheme": "./src/color-scheme.tsx",
    "./postcss.config": "./postcss.config.cjs"
  },
  "scripts": {
    "check-types": "tsc --noEmit"
  },
  "dependencies": {
    "@mantine/core": "^9.0.0",
    "@mantine/hooks": "^9.0.0",
    "@mantine/modals": "^9.0.0",
    "@mantine/notifications": "^9.0.0",
    "react": "catalog:",
    "react-dom": "catalog:"
  },
  "devDependencies": {
    "@prive-admin-tanstack/config": "workspace:*",
    "@types/react": "catalog:",
    "@types/react-dom": "catalog:",
    "postcss": "^8.4.49",
    "postcss-preset-mantine": "^1.17.0",
    "postcss-simple-vars": "^7.0.1",
    "typescript": "^6.0.2"
  }
}
```

- [ ] **Step 2: Delete shadcn artifacts**

```bash
rm /Users/mselvenis/dev/prive-admin/packages/ui/components.json
rm /Users/mselvenis/dev/prive-admin/packages/ui/src/lib/utils.ts
rm -rf /Users/mselvenis/dev/prive-admin/packages/ui/src/components
rm -rf /Users/mselvenis/dev/prive-admin/packages/ui/src/hooks
```

- [ ] **Step 3: Delete obsolete postcss config**

```bash
rm /Users/mselvenis/dev/prive-admin/packages/ui/postcss.config.mjs
```

- [ ] **Step 4: Run install so the workspace updates**

```bash
cd /Users/mselvenis/dev/prive-admin && bun install
```
Expected: lockfile updates; no errors. Mantine packages download.

- [ ] **Step 5: Commit**

```bash
git add packages/ui package.json bun.lock
git commit -m "chore(ui): swap shadcn/Tailwind deps for Mantine v9"
```

---

### Task 3: Build the new UI package source

**Files:**
- Create: `packages/ui/postcss.config.cjs`
- Create: `packages/ui/src/provider.tsx`
- Create: `packages/ui/src/theme.ts`
- Create: `packages/ui/src/color-scheme.tsx`
- Create: `packages/ui/src/index.ts`
- Modify: `packages/ui/src/styles/globals.css`

- [ ] **Step 1: Create `packages/ui/postcss.config.cjs`**

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

- [ ] **Step 2: Replace `packages/ui/src/styles/globals.css`**

Replace the entire current contents (Tailwind/shadcn variables) with:

```css
@import "@mantine/core/styles.css";
@import "@mantine/notifications/styles.css";
```

- [ ] **Step 3: Create `packages/ui/src/theme.ts`**

```ts
import { createTheme } from "@mantine/core"

export const theme = createTheme({})
```

- [ ] **Step 4: Create `packages/ui/src/color-scheme.tsx`**

```tsx
export { ColorSchemeScript, useMantineColorScheme, useComputedColorScheme } from "@mantine/core"
```

- [ ] **Step 5: Create `packages/ui/src/provider.tsx`**

```tsx
import { MantineProvider } from "@mantine/core"
import { ModalsProvider } from "@mantine/modals"
import { Notifications } from "@mantine/notifications"
import type { ReactNode } from "react"

import { theme } from "./theme"

export function UIProvider({ children }: { children: ReactNode }) {
  return (
    <MantineProvider theme={theme} defaultColorScheme="auto">
      <ModalsProvider>
        <Notifications />
        {children}
      </ModalsProvider>
    </MantineProvider>
  )
}
```

- [ ] **Step 6: Create `packages/ui/src/index.ts`**

```ts
export { UIProvider } from "./provider"
export { theme } from "./theme"
export { ColorSchemeScript, useMantineColorScheme, useComputedColorScheme } from "./color-scheme"
```

- [ ] **Step 7: Verify UI package type-checks in isolation**

```bash
cd /Users/mselvenis/dev/prive-admin && bun run -F @prive-admin-tanstack/ui check-types
```
Expected: PASS, no errors.

- [ ] **Step 8: Commit**

```bash
git add packages/ui
git commit -m "feat(ui): add Mantine UIProvider, theme, and color-scheme exports"
```

---

### Task 4: Update apps/web package.json

**Files:**
- Modify: `apps/web/package.json`

- [ ] **Step 1: Replace dependency lists**

Replace the `dependencies` and `devDependencies` blocks with:

```json
"dependencies": {
  "@aws-sdk/client-s3": "^3.1019.0",
  "@aws-sdk/s3-request-presigner": "^3.1019.0",
  "@mantine/core": "^9.0.0",
  "@mantine/form": "^9.0.0",
  "@mantine/hooks": "^9.0.0",
  "@mantine/modals": "^9.0.0",
  "@mantine/notifications": "^9.0.0",
  "@prive-admin-tanstack/auth": "workspace:*",
  "@prive-admin-tanstack/db": "workspace:*",
  "@prive-admin-tanstack/env": "workspace:*",
  "@prive-admin-tanstack/ui": "workspace:*",
  "@tabler/icons-react": "^3.26.0",
  "@tanstack/react-query": "^5.95.2",
  "@tanstack/react-router": "^1.168.7",
  "@tanstack/react-router-ssr-query": "^1.166.10",
  "@tanstack/react-router-with-query": "^1.130.17",
  "@tanstack/react-start": "^1.167.12",
  "@tanstack/router-plugin": "^1.167.8",
  "better-auth": "catalog:",
  "dotenv": "catalog:",
  "drizzle-orm": "^0.45.2",
  "mantine-form-zod-resolver": "^1.2.0",
  "react": "catalog:",
  "react-dom": "catalog:",
  "zod": "catalog:"
},
"devDependencies": {
  "@prive-admin-tanstack/config": "workspace:*",
  "@tanstack/react-router-devtools": "^1.166.11",
  "@testing-library/dom": "^10.4.1",
  "@testing-library/react": "^16.3.2",
  "@types/react": "catalog:",
  "@types/react-dom": "catalog:",
  "@vitejs/plugin-react": "^6.0.1",
  "jsdom": "^29.0.1",
  "postcss": "^8.4.49",
  "postcss-preset-mantine": "^1.17.0",
  "postcss-simple-vars": "^7.0.1",
  "typescript": "^6.0.2",
  "vite": "^8.0.3",
  "web-vitals": "^5.2.0"
}
```

Removed (compared with previous file):
- `@tailwindcss/vite`, `@tanstack/react-form`, `lucide-react`, `next-themes`, `sonner`, `tailwindcss`, `@fontsource-variable/dm-sans`, `@fontsource-variable/playfair-display`.

Added: `@mantine/core`, `@mantine/form`, `@mantine/hooks`, `@mantine/modals`, `@mantine/notifications`, `@tabler/icons-react`, `mantine-form-zod-resolver`, `postcss`, `postcss-preset-mantine`, `postcss-simple-vars`.

- [ ] **Step 2: Install**

```bash
cd /Users/mselvenis/dev/prive-admin && bun install
```
Expected: lockfile updates; new packages download.

- [ ] **Step 3: Commit**

```bash
git add apps/web/package.json bun.lock
git commit -m "chore(web): swap deps to Mantine v9 and Tabler icons"
```

---

### Task 5: Update apps/web build configuration

**Files:**
- Modify: `apps/web/vite.config.ts`
- Create: `apps/web/postcss.config.cjs`
- Modify: `apps/web/src/index.css` (already minimal, but remove any tailwind reference if present — currently it's a single `@import` line, leave as-is)

- [ ] **Step 1: Replace `apps/web/vite.config.ts`**

```ts
import { tanstackStart } from "@tanstack/react-start/plugin/vite"
import viteReact from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [tanstackStart(), viteReact()],
  server: {
    port: 3001,
  },
  resolve: {
    tsconfigPaths: true,
  },
})
```

- [ ] **Step 2: Create `apps/web/postcss.config.cjs`**

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

- [ ] **Step 3: Verify `apps/web/src/index.css`**

It should contain exactly:

```css
@import "@prive-admin-tanstack/ui/globals.css";
```

If anything else is there from a previous edit, replace with the line above.

- [ ] **Step 4: Commit**

```bash
git add apps/web/vite.config.ts apps/web/postcss.config.cjs apps/web/src/index.css
git commit -m "build(web): replace Tailwind Vite plugin with Mantine PostCSS preset"
```

---

### Task 6: Rewrite `__root.tsx` with `UIProvider`

**Files:**
- Modify: `apps/web/src/routes/__root.tsx`

- [ ] **Step 1: Replace file contents**

```tsx
import { ColorSchemeScript } from "@prive-admin-tanstack/ui/color-scheme"
import { UIProvider } from "@prive-admin-tanstack/ui/provider"
import { HeadContent, Outlet, Scripts, createRootRouteWithContext } from "@tanstack/react-router"
import { lazy, useEffect } from "react"

import { getLocale } from "@/functions/get-locale"
import { LocaleProvider } from "@/lib/locale-context"

const TanStackRouterDevtools =
  process.env.NODE_ENV === "production"
    ? () => null
    : lazy(() =>
        import("@tanstack/react-router-devtools").then((mod) => ({
          default: mod.TanStackRouterDevtools,
        })),
      )

import type { QueryClient } from "@tanstack/react-query"

import appCss from "../index.css?url"

export interface RouterAppContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  beforeLoad: async () => {
    const { locale, timeZone } = await getLocale()
    return { locale, timeZone }
  },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Privé" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),

  component: RootDocument,
})

function RootDocument() {
  const { locale, timeZone } = Route.useRouteContext()

  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    document.cookie = `tz=${tz};path=/;max-age=31536000`
  }, [])

  return (
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
  )
}
```

Removed (compared with previous file): `next-themes` `ThemeProvider`, sonner `Toaster`, `className="dark"` on `<html>`.

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/routes/__root.tsx
git commit -m "feat(web): wire UIProvider and ColorSchemeScript in root"
```

End of Phase 1. The build won't type-check yet because most components still import shadcn paths. That's expected — Phase 2+ clear those.

---

## Phase 2 — Shared atoms

### Task 7: Migrate `loader.tsx`

**Files:**
- Modify: `apps/web/src/components/loader.tsx`

- [ ] **Step 1: Replace file contents**

```tsx
import { Center, Loader as MantineLoader } from "@mantine/core"

export default function Loader() {
  return (
    <Center pt="md" h="100%">
      <MantineLoader />
    </Center>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/loader.tsx
git commit -m "refactor(web): use Mantine Loader"
```

---

### Task 8: Verify `client-date.tsx` (no change needed)

**Files:**
- Read-only: `apps/web/src/components/client-date.tsx`

- [ ] **Step 1: Confirm the file does not import from `@prive-admin-tanstack/ui` or `lucide-react`**

```bash
grep -E "ui/components|lucide-react|sonner|next-themes" /Users/mselvenis/dev/prive-admin/apps/web/src/components/client-date.tsx
```
Expected: no output (file is pure, just uses LocaleProvider).

If output appears, remove those imports per the spec map. Otherwise no change needed; skip the commit step for this task.

---

### Task 9: Rebuild `header.tsx` with color-scheme toggle, fold in user-menu

**Files:**
- Modify: `apps/web/src/components/header.tsx`
- Delete: `apps/web/src/components/user-menu.tsx`

- [ ] **Step 1: Replace `header.tsx`**

```tsx
import {
  ActionIcon,
  Avatar,
  Button,
  Container,
  Group,
  Menu,
  Skeleton,
  Text,
  UnstyledButton,
  useMantineColorScheme,
} from "@mantine/core"
import { IconChevronDown, IconDeviceDesktop, IconLogout, IconMoon, IconSun, IconUserCircle } from "@tabler/icons-react"
import { Link, useNavigate } from "@tanstack/react-router"

import { authClient } from "@/lib/auth-client"

const links = [
  { to: "/", label: "Home" },
  { to: "/playground", label: "Playground" },
  { to: "/files", label: "Files (Proxy)" },
  { to: "/files-direct", label: "Files (Direct)" },
] as const

export default function Header() {
  return (
    <Container size="lg" py="sm">
      <Group justify="space-between" wrap="nowrap">
        <Group gap="md">
          {links.map(({ to, label }) => (
            <Button key={to} component={Link} to={to} variant="subtle" size="sm">
              {label}
            </Button>
          ))}
        </Group>
        <Group gap="xs" wrap="nowrap">
          <ColorSchemeToggle />
          <UserSection />
        </Group>
      </Group>
    </Container>
  )
}

function ColorSchemeToggle() {
  const { colorScheme, setColorScheme } = useMantineColorScheme()
  const next = colorScheme === "light" ? "dark" : colorScheme === "dark" ? "auto" : "light"
  const Icon = colorScheme === "light" ? IconSun : colorScheme === "dark" ? IconMoon : IconDeviceDesktop

  return (
    <ActionIcon
      variant="default"
      size="lg"
      aria-label={`Color scheme: ${colorScheme}. Click to switch to ${next}.`}
      onClick={() => setColorScheme(next)}
    >
      <Icon size={18} />
    </ActionIcon>
  )
}

function UserSection() {
  const navigate = useNavigate()
  const { data: session, isPending } = authClient.useSession()

  if (isPending) {
    return <Skeleton height={28} width={140} />
  }

  if (!session) {
    return (
      <Button component={Link} to="/login" variant="default" size="sm">
        Sign In
      </Button>
    )
  }

  const user = session.user

  return (
    <Menu width={260} position="bottom-end" withinPortal>
      <Menu.Target>
        <UnstyledButton>
          <Group gap={7} wrap="nowrap">
            <Avatar radius="xl" size={20} color="initials" name={user.name} />
            <Text fw={500} size="sm" lh={1} mr={3}>
              {user.name}
            </Text>
            <IconChevronDown size={12} stroke={1.5} />
          </Group>
        </UnstyledButton>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>My account</Menu.Label>
        <Menu.Item disabled leftSection={<IconUserCircle size={16} stroke={1.5} />}>
          {user.email}
        </Menu.Item>
        <Menu.Divider />
        <Menu.Item
          color="red"
          leftSection={<IconLogout size={16} stroke={1.5} />}
          onClick={() =>
            authClient.signOut({
              fetchOptions: {
                onSuccess: () => {
                  navigate({ to: "/" })
                },
              },
            })
          }
        >
          Sign out
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  )
}
```

- [ ] **Step 2: Delete `apps/web/src/components/user-menu.tsx`**

```bash
rm /Users/mselvenis/dev/prive-admin/apps/web/src/components/user-menu.tsx
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/header.tsx apps/web/src/components/user-menu.tsx
git commit -m "feat(web): rebuild header with Mantine and fold in user menu"
```

---

## Phase 3 — Auth flow

### Task 10: Migrate `sign-in-form.tsx` to `@mantine/form`

**Files:**
- Modify: `apps/web/src/components/sign-in-form.tsx`

- [ ] **Step 1: Replace file contents**

```tsx
import { Button, Container, PasswordInput, Stack, TextInput, Title } from "@mantine/core"
import { useForm } from "@mantine/form"
import { notifications } from "@mantine/notifications"
import { useNavigate } from "@tanstack/react-router"
import { zodResolver } from "mantine-form-zod-resolver"
import { useState } from "react"
import z from "zod"

import { authClient } from "@/lib/auth-client"

import Loader from "./loader"

const schema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

type SignInValues = z.infer<typeof schema>

export default function SignInForm({
  onSwitchToSignUp,
  redirectTo,
}: {
  onSwitchToSignUp: () => void
  redirectTo?: string
}) {
  const navigate = useNavigate()
  const { isPending } = authClient.useSession()
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<SignInValues>({
    initialValues: { email: "", password: "" },
    validate: zodResolver(schema),
  })

  if (isPending) {
    return <Loader />
  }

  const handleSubmit = async (values: SignInValues) => {
    setSubmitting(true)
    await authClient.signIn.email(
      { email: values.email, password: values.password },
      {
        onSuccess: () => {
          navigate({ to: redirectTo ?? "/customers" })
          notifications.show({ color: "green", message: "Sign in successful" })
        },
        onError: (error) => {
          notifications.show({ color: "red", message: error.error.message || error.error.statusText })
        },
      },
    )
    setSubmitting(false)
  }

  return (
    <Container size="xs" mt="xl">
      <Title order={1} ta="center" mb="lg">
        Welcome Back
      </Title>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput label="Email" type="email" {...form.getInputProps("email")} />
          <PasswordInput label="Password" {...form.getInputProps("password")} />
          <Button type="submit" fullWidth loading={submitting}>
            Sign In
          </Button>
        </Stack>
      </form>
      <Stack mt="md" align="center">
        <Button variant="subtle" onClick={onSwitchToSignUp}>
          Need an account? Sign Up
        </Button>
      </Stack>
    </Container>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/sign-in-form.tsx
git commit -m "refactor(web): port sign-in form to @mantine/form"
```

---

### Task 11: Migrate `sign-up-form.tsx` to `@mantine/form`

**Files:**
- Modify: `apps/web/src/components/sign-up-form.tsx`

- [ ] **Step 1: Replace file contents**

```tsx
import { Button, Container, PasswordInput, Stack, TextInput, Title } from "@mantine/core"
import { useForm } from "@mantine/form"
import { notifications } from "@mantine/notifications"
import { useNavigate } from "@tanstack/react-router"
import { zodResolver } from "mantine-form-zod-resolver"
import { useState } from "react"
import z from "zod"

import { authClient } from "@/lib/auth-client"

import Loader from "./loader"

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

type SignUpValues = z.infer<typeof schema>

export default function SignUpForm({
  onSwitchToSignIn,
  redirectTo,
}: {
  onSwitchToSignIn: () => void
  redirectTo?: string
}) {
  const navigate = useNavigate()
  const { isPending } = authClient.useSession()
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<SignUpValues>({
    initialValues: { name: "", email: "", password: "" },
    validate: zodResolver(schema),
  })

  if (isPending) {
    return <Loader />
  }

  const handleSubmit = async (values: SignUpValues) => {
    setSubmitting(true)
    await authClient.signUp.email(
      { email: values.email, password: values.password, name: values.name },
      {
        onSuccess: () => {
          navigate({ to: redirectTo ?? "/dashboard" })
          notifications.show({ color: "green", message: "Sign up successful" })
        },
        onError: (error) => {
          notifications.show({ color: "red", message: error.error.message || error.error.statusText })
        },
      },
    )
    setSubmitting(false)
  }

  return (
    <Container size="xs" mt="xl">
      <Title order={1} ta="center" mb="lg">
        Create Account
      </Title>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <TextInput label="Name" {...form.getInputProps("name")} />
          <TextInput label="Email" type="email" {...form.getInputProps("email")} />
          <PasswordInput label="Password" {...form.getInputProps("password")} />
          <Button type="submit" fullWidth loading={submitting}>
            Sign Up
          </Button>
        </Stack>
      </form>
      <Stack mt="md" align="center">
        <Button variant="subtle" onClick={onSwitchToSignIn}>
          Already have an account? Sign In
        </Button>
      </Stack>
    </Container>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/sign-up-form.tsx
git commit -m "refactor(web): port sign-up form to @mantine/form"
```

---

### Task 12: Migrate `routes/login.tsx`

**Files:**
- Modify: `apps/web/src/routes/login.tsx`

- [ ] **Step 1: Replace file contents**

```tsx
import { ActionIcon, Box, Center, Stack, Title } from "@mantine/core"
import { useMantineColorScheme } from "@mantine/core"
import { IconDeviceDesktop, IconMoon, IconSun } from "@tabler/icons-react"
import { Link, createFileRoute, redirect } from "@tanstack/react-router"
import { useState } from "react"
import { z } from "zod"

import SignInForm from "@/components/sign-in-form"
import SignUpForm from "@/components/sign-up-form"
import { getUser } from "@/functions/get-user"

export const Route = createFileRoute("/login")({
  component: RouteComponent,
  validateSearch: z.object({
    redirect: z.string().optional(),
  }),
  beforeLoad: async () => {
    const session = await getUser()
    if (session) {
      throw redirect({ to: "/customers" })
    }
  },
})

function RouteComponent() {
  const { redirect } = Route.useSearch()
  const [showSignIn, setShowSignIn] = useState(false)
  const { colorScheme, setColorScheme } = useMantineColorScheme()

  const next = colorScheme === "light" ? "dark" : colorScheme === "dark" ? "auto" : "light"
  const Icon = colorScheme === "light" ? IconSun : colorScheme === "dark" ? IconMoon : IconDeviceDesktop

  return (
    <Box mih="100vh" pos="relative">
      <ActionIcon
        variant="default"
        size="lg"
        pos="absolute"
        top={16}
        right={16}
        aria-label={`Color scheme: ${colorScheme}.`}
        onClick={() => setColorScheme(next)}
      >
        <Icon size={18} />
      </ActionIcon>

      <Center mih="100vh">
        <Stack align="center" w="100%" maw={420} px="md">
          <Link to="/">
            <Title order={2} fw={300}>
              Privé
            </Title>
          </Link>
          {showSignIn ? (
            <SignInForm onSwitchToSignUp={() => setShowSignIn(false)} redirectTo={redirect} />
          ) : (
            <SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} redirectTo={redirect} />
          )}
        </Stack>
      </Center>
    </Box>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/routes/login.tsx
git commit -m "refactor(web): port login route to Mantine layout"
```

---

### Task 13: Migrate `routes/index.tsx` (landing page)

**Files:**
- Modify: `apps/web/src/routes/index.tsx`

The current landing page is a custom marketing layout with noise overlays, gradient glows, and serif typography — all driven by Tailwind utilities. Per the spec ("functional parity, Mantine-native look"), reduce it to a simple Mantine landing.

- [ ] **Step 1: Replace file contents**

```tsx
import {
  ActionIcon,
  Anchor,
  Box,
  Button,
  Card,
  Container,
  Divider,
  Group,
  SimpleGrid,
  Stack,
  Text,
  Title,
  useMantineColorScheme,
} from "@mantine/core"
import { IconArrowRight, IconDeviceDesktop, IconMoon, IconSun } from "@tabler/icons-react"
import { Link, createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/")({
  component: LandingPage,
})

const services = [
  {
    number: "I",
    title: "Secure Vault",
    description: "End-to-end encrypted file management with granular access controls and audit trails.",
  },
  {
    number: "II",
    title: "Identity",
    description: "Multi-layered authentication with biometric support and session intelligence.",
  },
  {
    number: "III",
    title: "Analytics",
    description: "Real-time insights with privacy-first data processing. No external tracking.",
  },
]

function LandingPage() {
  const { colorScheme, setColorScheme } = useMantineColorScheme()
  const next = colorScheme === "light" ? "dark" : colorScheme === "dark" ? "auto" : "light"
  const Icon = colorScheme === "light" ? IconSun : colorScheme === "dark" ? IconMoon : IconDeviceDesktop

  return (
    <Box>
      <Container size="lg" py="md">
        <Group justify="space-between">
          <Text size="xs" c="dimmed" tt="uppercase">
            Est. 2024
          </Text>
          <Group gap="md">
            <Anchor href="#philosophy" size="xs" c="dimmed">
              Philosophy
            </Anchor>
            <Anchor href="#services" size="xs" c="dimmed">
              Services
            </Anchor>
            <Anchor href="#contact" size="xs" c="dimmed">
              Contact
            </Anchor>
            <ActionIcon variant="default" onClick={() => setColorScheme(next)} aria-label="Toggle color scheme">
              <Icon size={16} />
            </ActionIcon>
          </Group>
        </Group>
      </Container>

      <Container size="md" py="xl">
        <Stack align="center" gap="lg" mt={80} mb={120}>
          <Text size="xs" c="dimmed" tt="uppercase">
            Exclusive Access
          </Text>
          <Title order={1} fw={300} ta="center" size={96}>
            Privé
          </Title>
          <Text c="dimmed" ta="center" maw={420}>
            Where discretion meets distinction. A private platform for those who understand that true luxury is
            invisible.
          </Text>
          <Button component="a" href="#philosophy" variant="default" rightSection={<IconArrowRight size={14} />}>
            Discover
          </Button>
        </Stack>
      </Container>

      <Container size="md" py="xl" id="philosophy">
        <Stack gap="md">
          <Text size="xs" c="dimmed" tt="uppercase">
            01 — Philosophy
          </Text>
          <Title order={2} fw={300}>
            Built for the discerning few
          </Title>
          <Text c="dimmed">
            Not everything needs to be public. Some platforms are built for visibility; ours is built for control. Every
            feature, every interaction is designed with intentional restraint — because power doesn&rsquo;t need to
            announce itself.
          </Text>
        </Stack>
      </Container>

      <Container size="lg" py="xl" id="services">
        <Stack gap="lg">
          <Stack gap="xs" align="center">
            <Text size="xs" c="dimmed" tt="uppercase">
              02 — Services
            </Text>
            <Title order={2} fw={300}>
              Curated capabilities
            </Title>
          </Stack>
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
            {services.map((service) => (
              <Card key={service.number} withBorder padding="lg">
                <Title order={3} fw={300} c="dimmed">
                  {service.number}
                </Title>
                <Title order={4} fw={300} mt="sm">
                  {service.title}
                </Title>
                <Text c="dimmed" mt="xs" size="sm">
                  {service.description}
                </Text>
              </Card>
            ))}
          </SimpleGrid>
        </Stack>
      </Container>

      <Container size="sm" py="xl" id="contact">
        <Stack align="center" gap="md">
          <Text size="xs" c="dimmed" tt="uppercase">
            03 — Contact
          </Text>
          <Title order={2} fw={300} ta="center">
            By invitation only
          </Title>
          <Text c="dimmed" ta="center">
            Access is granted on a referral basis. If you&rsquo;ve been given credentials, you already know how to
            proceed.
          </Text>
          <Button component={Link} to="/login" variant="default">
            Member Access
          </Button>
        </Stack>
      </Container>

      <Divider />
      <Container size="lg" py="md">
        <Group justify="space-between">
          <Text size="xs" c="dimmed">
            Privé © 2024
          </Text>
          <Text size="xs" c="dimmed" tt="uppercase">
            All rights reserved
          </Text>
        </Group>
      </Container>
    </Box>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/routes/index.tsx
git commit -m "refactor(web): port landing page to Mantine layout"
```

---

## Phase 4 — Authenticated shell

### Task 14: Migrate `_authenticated/route.tsx` to Mantine `AppShell`

**Files:**
- Modify: `apps/web/src/routes/_authenticated/route.tsx`

- [ ] **Step 1: Replace file contents**

```tsx
import type { ErrorComponentProps } from "@tanstack/react-router"

import {
  ActionIcon,
  AppShell,
  Burger,
  Button,
  Card,
  Group,
  NavLink,
  Stack,
  Text,
  Title,
  useMantineColorScheme,
} from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import {
  IconAlertCircle,
  IconCalendar,
  IconDeviceDesktop,
  IconFolderOpen,
  IconLayoutDashboard,
  IconLogout,
  IconMoon,
  IconRefresh,
  IconScissors,
  IconServer,
  IconSun,
  IconUsers,
} from "@tabler/icons-react"
import { useQueryErrorResetBoundary } from "@tanstack/react-query"
import { Link, Outlet, createFileRoute, redirect, useRouter, useRouterState } from "@tanstack/react-router"

import { getUser } from "@/functions/get-user"
import { authClient } from "@/lib/auth-client"

const NAV_ITEMS = [
  { to: "/customers", label: "Customers", icon: IconUsers },
  { to: "/appointments", label: "Appointments", icon: IconCalendar },
  { to: "/hair-orders", label: "Hair Orders", icon: IconScissors },
  { to: "/playground", label: "Playground", icon: IconLayoutDashboard },
  { to: "/files", label: "Files (Proxy)", icon: IconFolderOpen },
  { to: "/files-direct", label: "Files (Direct)", icon: IconServer },
] as const

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
  errorComponent: AuthenticatedErrorComponent,
  beforeLoad: async ({ location }) => {
    const session = await getUser()
    if (!session) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      })
    }
    return { session }
  },
})

function AuthenticatedLayout() {
  const [opened, { toggle }] = useDisclosure()
  const { session } = Route.useRouteContext()
  const router = useRouter()
  const routerState = useRouterState()
  const currentPath = routerState.location.pathname
  const { colorScheme, setColorScheme } = useMantineColorScheme()
  const next = colorScheme === "light" ? "dark" : colorScheme === "dark" ? "auto" : "light"
  const Icon = colorScheme === "light" ? IconSun : colorScheme === "dark" ? IconMoon : IconDeviceDesktop

  return (
    <AppShell
      header={{ height: 56 }}
      navbar={{ width: 240, breakpoint: "sm", collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Title order={4} fw={300}>
              Privé
            </Title>
          </Group>
          <ActionIcon variant="default" onClick={() => setColorScheme(next)} aria-label="Toggle color scheme">
            <Icon size={16} />
          </ActionIcon>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="sm">
        <Stack gap="xs" style={{ flex: 1 }}>
          {NAV_ITEMS.map(({ to, label, icon: ItemIcon }) => {
            const active = currentPath === to || currentPath.startsWith(`${to}/`)
            return (
              <NavLink
                key={to}
                component={Link}
                to={to}
                label={label}
                leftSection={<ItemIcon size={16} />}
                active={active}
              />
            )
          })}
        </Stack>
        <Stack gap="xs" mt="md">
          <Text size="xs" c="dimmed" truncate>
            {session?.user.email}
          </Text>
          <Button
            variant="subtle"
            color="red"
            leftSection={<IconLogout size={16} />}
            onClick={() =>
              authClient.signOut({
                fetchOptions: {
                  onSuccess: () => {
                    router.navigate({ to: "/" })
                  },
                },
              })
            }
            justify="flex-start"
          >
            Sign Out
          </Button>
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}

function AuthenticatedErrorComponent({ error, reset }: ErrorComponentProps) {
  const router = useRouter()
  const queryErrorResetBoundary = useQueryErrorResetBoundary()

  const handleRetry = () => {
    queryErrorResetBoundary.reset()
    reset()
    router.invalidate()
  }

  return (
    <Card withBorder maw={420} mx="auto" mt="xl" p="lg">
      <Group gap="xs" mb="xs">
        <IconAlertCircle size={16} color="var(--mantine-color-red-6)" />
        <Text fw={500}>Something went wrong</Text>
      </Group>
      <Text size="sm" c="dimmed" mb="md">
        {error.message || "An unexpected error occurred."}
      </Text>
      <Button variant="default" size="sm" leftSection={<IconRefresh size={14} />} onClick={handleRetry}>
        Try again
      </Button>
    </Card>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/routes/_authenticated/route.tsx
git commit -m "refactor(web): port authenticated shell to Mantine AppShell"
```

---

### Task 15: Migrate `_authenticated/settings.tsx`

**Files:**
- Modify: `apps/web/src/routes/_authenticated/settings.tsx`

- [ ] **Step 1: Replace file contents**

```tsx
import { Card, Container, Group, Stack, Text, Title } from "@mantine/core"
import { createFileRoute } from "@tanstack/react-router"

import { ClientDate } from "@/components/client-date"
import { useLocale } from "@/lib/locale-context"

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
})

function SettingsPage() {
  const { locale, timeZone } = useLocale()

  return (
    <Container size="sm">
      <Title order={2} mb="md">
        Settings
      </Title>
      <Card withBorder>
        <Title order={4} mb="sm">
          Locale & Timezone
        </Title>
        <Stack gap="xs">
          <Group justify="space-between">
            <Text c="dimmed" size="sm">
              Locale
            </Text>
            <Text size="sm">{locale}</Text>
          </Group>
          <Group justify="space-between">
            <Text c="dimmed" size="sm">
              Timezone
            </Text>
            <Text size="sm">{timeZone}</Text>
          </Group>
          <Group justify="space-between">
            <Text c="dimmed" size="sm">
              Date preview
            </Text>
            <Text size="sm">
              <ClientDate date={new Date()} />
            </Text>
          </Group>
          <Group justify="space-between">
            <Text c="dimmed" size="sm">
              DateTime preview
            </Text>
            <Text size="sm">
              <ClientDate date={new Date()} showTime />
            </Text>
          </Group>
        </Stack>
      </Card>
    </Container>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/routes/_authenticated/settings.tsx
git commit -m "refactor(web): port settings page to Mantine"
```

---

### Task 16: Migrate `components/file-list.tsx`

**Files:**
- Modify: `apps/web/src/components/file-list.tsx`

- [ ] **Step 1: Replace file contents**

```tsx
import { ActionIcon, Card, Center, Group, Loader, Skeleton, Stack, Table, Text, Title } from "@mantine/core"
import {
  IconCloud,
  IconFile,
  IconFileText,
  IconMusic,
  IconPhoto,
  IconTrash,
  IconVideo,
} from "@tabler/icons-react"
import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import type { FileItem } from "@/functions/files"

import { deleteFile, listFiles } from "@/functions/files"
import { fileKeys } from "@/lib/query-keys"

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const units = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

function formatDate(iso: string): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  })
}

function fileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() ?? ""
  if (["jpg", "jpeg", "png", "gif", "webp", "svg", "avif"].includes(ext)) return <IconPhoto size={16} />
  if (["mp4", "webm", "mov", "avi"].includes(ext)) return <IconVideo size={16} />
  if (["mp3", "wav", "ogg", "flac"].includes(ext)) return <IconMusic size={16} />
  if (["pdf", "doc", "docx", "txt", "md"].includes(ext)) return <IconFileText size={16} />
  return <IconFile size={16} />
}

export const filesQueryOptions = queryOptions({
  queryKey: fileKeys.list(),
  queryFn: () => listFiles(),
})

export function useFiles() {
  const queryClient = useQueryClient()
  const { data: files, isLoading } = useQuery(filesQueryOptions)

  const deleteMutation = useMutation({
    mutationFn: (key: string) => deleteFile({ data: { key } }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: fileKeys.all }),
  })

  const totalSize = files?.reduce((sum, f) => sum + f.size, 0) ?? 0

  return { files, isLoading, totalSize, deleteMutation }
}

export function FileListCard({
  files,
  isLoading,
  deleteMutation,
}: {
  files: FileItem[] | undefined
  isLoading: boolean
  deleteMutation: ReturnType<typeof useFiles>["deleteMutation"]
}) {
  return (
    <Card withBorder>
      <Title order={4} mb="sm">
        Stored Files
      </Title>
      <Text size="xs" c="dimmed" mb="md">
        Files in the uploads directory
      </Text>
      {isLoading ? (
        <Stack gap="xs">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} h={20} />
          ))}
        </Stack>
      ) : !files?.length ? (
        <Center py="xl">
          <Stack align="center" gap="xs">
            <IconCloud size={32} />
            <Text size="sm" c="dimmed">
              No files uploaded yet
            </Text>
          </Stack>
        </Center>
      ) : (
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th ta="right">Size</Table.Th>
              <Table.Th ta="right">Modified</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {files.map((file) => (
              <FileRow
                key={file.key}
                file={file}
                onDelete={() => deleteMutation.mutate(file.key)}
                isDeleting={deleteMutation.isPending && deleteMutation.variables === file.key}
              />
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Card>
  )
}

function FileRow({ file, onDelete, isDeleting }: { file: FileItem; onDelete: () => void; isDeleting: boolean }) {
  return (
    <Table.Tr>
      <Table.Td>
        <Group gap="xs">
          {fileIcon(file.name)}
          <Text size="sm">{file.name}</Text>
        </Group>
      </Table.Td>
      <Table.Td ta="right" c="dimmed">
        <Text size="xs">{formatBytes(file.size)}</Text>
      </Table.Td>
      <Table.Td ta="right" c="dimmed">
        <Text size="xs">{formatDate(file.lastModified)}</Text>
      </Table.Td>
      <Table.Td>
        <ActionIcon variant="subtle" color="red" onClick={onDelete} disabled={isDeleting} aria-label="Delete file">
          {isDeleting ? <Loader size={12} /> : <IconTrash size={14} />}
        </ActionIcon>
      </Table.Td>
    </Table.Tr>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/file-list.tsx
git commit -m "refactor(web): port file list to Mantine"
```

---

### Task 17: Migrate `_authenticated/files.tsx` (Server Proxy)

**Files:**
- Modify: `apps/web/src/routes/_authenticated/files.tsx`

- [ ] **Step 1: Replace file contents**

```tsx
import { Badge, Box, Button, Card, Container, Divider, Group, Progress, Skeleton, Stack, Text, Title } from "@mantine/core"
import { IconCloud, IconUpload } from "@tabler/icons-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useRef, useState } from "react"

import { FileListCard, filesQueryOptions, formatBytes, useFiles } from "@/components/file-list"
import { fileKeys } from "@/lib/query-keys"

export const Route = createFileRoute("/_authenticated/files")({
  component: FilesProxyPage,
  loader: async ({ context }) => {
    await context.queryClient.prefetchQuery(filesQueryOptions)
  },
})

interface UploadProgress {
  fileName: string
  progress: number
  status: "uploading" | "done" | "error"
}

function uploadFileViaProxy(file: File, onProgress: (pct: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const formData = new FormData()
    formData.append("file", file)
    const xhr = new XMLHttpRequest()
    xhr.open("POST", "/api/upload")
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve()
      else reject(new Error(`Upload failed: ${xhr.status}`))
    }
    xhr.onerror = () => reject(new Error("Network error"))
    xhr.send(formData)
  })
}

function FilesProxyPage() {
  const { files, isLoading, totalSize, deleteMutation } = useFiles()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploads, setUploads] = useState<UploadProgress[]>([])

  const uploadMutation = useMutation({
    mutationKey: ["files", "upload-proxy"],
    mutationFn: async (fileList: File[]) => {
      const newUploads: UploadProgress[] = fileList.map((f) => ({ fileName: f.name, progress: 0, status: "uploading" }))
      setUploads((prev) => [...newUploads, ...prev])
      await Promise.allSettled(
        fileList.map(async (file, i) => {
          try {
            await uploadFileViaProxy(file, (pct) => {
              setUploads((prev) => prev.map((u, idx) => (idx === i ? { ...u, progress: pct } : u)))
            })
            setUploads((prev) =>
              prev.map((u, idx) => (idx === i ? { ...u, progress: 100, status: "done" } : u)),
            )
          } catch {
            setUploads((prev) => prev.map((u, idx) => (idx === i ? { ...u, status: "error" } : u)))
          }
        }),
      )
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: fileKeys.all })
      setTimeout(() => {
        setUploads((prev) => prev.filter((u) => u.status === "uploading"))
      }, 3000)
    },
  })

  const uploadFiles = (fileList: FileList | File[]) => {
    uploadMutation.mutate(Array.from(fileList))
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files.length > 0) uploadFiles(e.dataTransfer.files)
  }

  return (
    <Container size="md">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-end">
          <Stack gap={4}>
            <Text size="xs" c="dimmed" tt="uppercase">
              Files — Server Proxy
            </Text>
            <Title order={2}>Server Proxy Upload</Title>
            <Text size="sm" c="dimmed">
              Files are sent through the server to R2. No CORS needed.
            </Text>
          </Stack>
          <Group gap="xs">
            <Text size="xs" c="dimmed">
              {isLoading ? <Skeleton h={12} w={80} /> : `${files?.length ?? 0} files · ${formatBytes(totalSize)}`}
            </Text>
            <Button
              size="sm"
              leftSection={<IconUpload size={14} />}
              onClick={() => fileInputRef.current?.click()}
            >
              Upload
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              hidden
              onChange={(e) => {
                if (e.target.files?.length) {
                  uploadFiles(e.target.files)
                  e.target.value = ""
                }
              }}
            />
          </Group>
        </Group>

        <Divider />

        <Box
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={(e) => {
            e.preventDefault()
            setIsDragging(false)
          }}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: "2px dashed var(--mantine-color-default-border)",
            borderRadius: "var(--mantine-radius-md)",
            padding: "var(--mantine-spacing-xl)",
            textAlign: "center",
            cursor: "pointer",
            background: isDragging ? "var(--mantine-color-default-hover)" : undefined,
          }}
        >
          <Stack align="center" gap="xs">
            <IconCloud size={32} />
            <Text size="sm">{isDragging ? "Drop files here" : "Drag & drop files here"}</Text>
            <Text size="xs" c="dimmed">
              or click to browse · proxied through server
            </Text>
          </Stack>
        </Box>

        {uploads.length > 0 && (
          <Card withBorder>
            <Title order={5} mb="sm">
              Uploads
            </Title>
            <Stack gap="xs">
              {uploads.map((upload, i) => (
                <Stack key={i} gap={4}>
                  <Group justify="space-between">
                    <Text size="xs" truncate>
                      {upload.fileName}
                    </Text>
                    <Badge
                      size="sm"
                      color={upload.status === "done" ? "green" : upload.status === "error" ? "red" : undefined}
                      variant={upload.status === "uploading" ? "outline" : "light"}
                    >
                      {upload.status === "uploading"
                        ? `${upload.progress}%`
                        : upload.status === "done"
                          ? "Done"
                          : "Failed"}
                    </Badge>
                  </Group>
                  <Progress
                    value={upload.progress}
                    color={upload.status === "error" ? "red" : undefined}
                    size="xs"
                  />
                </Stack>
              ))}
            </Stack>
          </Card>
        )}

        <FileListCard files={files} isLoading={isLoading} deleteMutation={deleteMutation} />
      </Stack>
    </Container>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/routes/_authenticated/files.tsx
git commit -m "refactor(web): port server-proxy file upload to Mantine"
```

---

### Task 18: Migrate `_authenticated/files-direct.tsx` (Direct Upload)

**Files:**
- Modify: `apps/web/src/routes/_authenticated/files-direct.tsx`

- [ ] **Step 1: Replace file contents**

```tsx
import { Badge, Box, Button, Card, Container, Divider, Group, Progress, Skeleton, Stack, Text, Title } from "@mantine/core"
import { IconCloud, IconUpload } from "@tabler/icons-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useRef, useState } from "react"

import { FileListCard, filesQueryOptions, formatBytes, useFiles } from "@/components/file-list"
import { confirmUpload, getUploadUrl } from "@/functions/files"
import { fileKeys } from "@/lib/query-keys"

export const Route = createFileRoute("/_authenticated/files-direct")({
  component: FilesDirectPage,
  loader: async ({ context }) => {
    await context.queryClient.prefetchQuery(filesQueryOptions)
  },
})

interface UploadProgress {
  fileName: string
  progress: number
  status: "uploading" | "confirming" | "done" | "error"
}

function uploadToPresignedUrl(file: File, url: string, onProgress: (pct: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open("PUT", url)
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream")
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve()
      else reject(new Error(`Upload failed: ${xhr.status}`))
    }
    xhr.onerror = () => reject(new Error("Network error"))
    xhr.send(file)
  })
}

function FilesDirectPage() {
  const { files, isLoading, totalSize, deleteMutation } = useFiles()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploads, setUploads] = useState<UploadProgress[]>([])

  const uploadMutation = useMutation({
    mutationKey: ["files", "upload-direct"],
    mutationFn: async (fileList: File[]) => {
      const newUploads: UploadProgress[] = fileList.map((f) => ({ fileName: f.name, progress: 0, status: "uploading" }))
      setUploads((prev) => [...newUploads, ...prev])
      await Promise.allSettled(
        fileList.map(async (file, i) => {
          try {
            const { url, key } = await getUploadUrl({
              data: { fileName: file.name, contentType: file.type || "application/octet-stream" },
            })
            await uploadToPresignedUrl(file, url, (pct) => {
              setUploads((prev) => prev.map((u, idx) => (idx === i ? { ...u, progress: pct } : u)))
            })
            setUploads((prev) =>
              prev.map((u, idx) => (idx === i ? { ...u, progress: 100, status: "confirming" } : u)),
            )
            await confirmUpload({ data: { key } })
            setUploads((prev) => prev.map((u, idx) => (idx === i ? { ...u, status: "done" } : u)))
          } catch {
            setUploads((prev) => prev.map((u, idx) => (idx === i ? { ...u, status: "error" } : u)))
          }
        }),
      )
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: fileKeys.all })
      setTimeout(() => {
        setUploads((prev) => prev.filter((u) => u.status === "uploading"))
      }, 3000)
    },
  })

  const uploadFiles = (fileList: FileList | File[]) => {
    uploadMutation.mutate(Array.from(fileList))
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files.length > 0) uploadFiles(e.dataTransfer.files)
  }

  return (
    <Container size="md">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-end">
          <Stack gap={4}>
            <Text size="xs" c="dimmed" tt="uppercase">
              Files — Direct Upload
            </Text>
            <Title order={2}>Presigned URL Upload</Title>
            <Text size="sm" c="dimmed">
              Files are uploaded directly to R2 via presigned URLs. Requires CORS on the bucket.
            </Text>
          </Stack>
          <Group gap="xs">
            <Text size="xs" c="dimmed">
              {isLoading ? <Skeleton h={12} w={80} /> : `${files?.length ?? 0} files · ${formatBytes(totalSize)}`}
            </Text>
            <Button
              size="sm"
              leftSection={<IconUpload size={14} />}
              onClick={() => fileInputRef.current?.click()}
            >
              Upload
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              hidden
              onChange={(e) => {
                if (e.target.files?.length) {
                  uploadFiles(e.target.files)
                  e.target.value = ""
                }
              }}
            />
          </Group>
        </Group>

        <Divider />

        <Box
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={(e) => {
            e.preventDefault()
            setIsDragging(false)
          }}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: "2px dashed var(--mantine-color-default-border)",
            borderRadius: "var(--mantine-radius-md)",
            padding: "var(--mantine-spacing-xl)",
            textAlign: "center",
            cursor: "pointer",
            background: isDragging ? "var(--mantine-color-default-hover)" : undefined,
          }}
        >
          <Stack align="center" gap="xs">
            <IconCloud size={32} />
            <Text size="sm">{isDragging ? "Drop files here" : "Drag & drop files here"}</Text>
            <Text size="xs" c="dimmed">
              or click to browse · direct to R2 with real progress
            </Text>
          </Stack>
        </Box>

        {uploads.length > 0 && (
          <Card withBorder>
            <Title order={5} mb="sm">
              Uploads
            </Title>
            <Stack gap="xs">
              {uploads.map((upload, i) => (
                <Stack key={i} gap={4}>
                  <Group justify="space-between">
                    <Text size="xs" truncate>
                      {upload.fileName}
                    </Text>
                    <Badge
                      size="sm"
                      color={
                        upload.status === "done"
                          ? "green"
                          : upload.status === "error"
                            ? "red"
                            : undefined
                      }
                      variant={upload.status === "uploading" ? "outline" : "light"}
                    >
                      {upload.status === "uploading"
                        ? `${upload.progress}%`
                        : upload.status === "confirming"
                          ? "Confirming…"
                          : upload.status === "done"
                            ? "Done"
                            : "Failed"}
                    </Badge>
                  </Group>
                  <Progress
                    value={upload.progress}
                    color={upload.status === "error" ? "red" : undefined}
                    size="xs"
                  />
                </Stack>
              ))}
            </Stack>
          </Card>
        )}

        <FileListCard files={files} isLoading={isLoading} deleteMutation={deleteMutation} />
      </Stack>
    </Container>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/routes/_authenticated/files-direct.tsx
git commit -m "refactor(web): port direct R2 upload page to Mantine"
```

---

### Task 19: Migrate `_authenticated/playground.tsx` (dashboard)

**Files:**
- Modify: `apps/web/src/routes/_authenticated/playground.tsx`

This file is large; the migration is mechanical: shadcn → Mantine per the spec map, lucide → tabler, custom `Progress`/`ProgressLabel`/`ProgressValue` from shadcn become a single Mantine `Progress` with a label rendered above it.

- [ ] **Step 1: Replace file contents**

```tsx
import { Badge, Button, Card, Container, Divider, Group, Modal, Progress, SimpleGrid, Skeleton, Stack, Text, Title } from "@mantine/core"
import {
  IconActivity,
  IconDatabase,
  IconFileText,
  IconLayoutDashboard,
  IconLoader2,
  IconLock,
  IconMonitor,
  IconSettings,
  IconShield,
  IconTrendingUp,
  IconUserCog,
  IconUsers,
  IconBolt,
} from "@tabler/icons-react"
import { queryOptions, useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import type { Icon as TablerIcon } from "@tabler/icons-react"
import { useState } from "react"

import type { CapabilityDetails } from "@/functions/get-capability-details"
import type { DashboardCapability, DashboardStat } from "@/functions/get-dashboard-data"

import { getCapabilityDetails } from "@/functions/get-capability-details"
import { getDashboardData } from "@/functions/get-dashboard-data"
import { dashboardKeys } from "@/lib/query-keys"

const iconMap: Record<string, TablerIcon> = {
  users: IconUsers,
  activity: IconActivity,
  zap: IconBolt,
  monitor: IconMonitor,
  "user-cog": IconUserCog,
  lock: IconLock,
  database: IconDatabase,
  "trending-up": IconTrendingUp,
  shield: IconShield,
  "file-text": IconFileText,
}

const dashboardQueryOptions = queryOptions({
  queryKey: dashboardKeys.data(),
  queryFn: () => getDashboardData(),
})

export const Route = createFileRoute("/_authenticated/playground")({
  component: RouteComponent,
  loader: async ({ context }) => {
    await context.queryClient.prefetchQuery(dashboardQueryOptions)
  },
})

function StatusBadge({ status }: { status: DashboardCapability["status"] }) {
  const labels = { active: "Active", beta: "Beta", coming: "Coming Soon" }
  const colors: Record<DashboardCapability["status"], string | undefined> = {
    active: "green",
    beta: undefined,
    coming: "gray",
  }
  return (
    <Badge color={colors[status]} variant={status === "beta" ? "outline" : "light"}>
      {labels[status]}
    </Badge>
  )
}

function StatCard({ stat }: { stat: DashboardStat }) {
  const Icon = iconMap[stat.icon] ?? IconActivity
  return (
    <Card withBorder padding="md">
      <Group justify="space-between" align="flex-start">
        <Stack gap={4}>
          <Text size="xs" c="dimmed">
            {stat.label}
          </Text>
          <Title order={3}>{stat.value}</Title>
          <Text size="xs" c="green">
            {stat.change} from last month
          </Text>
        </Stack>
        <Icon size={20} />
      </Group>
    </Card>
  )
}

function StatCardSkeleton() {
  return (
    <Card withBorder padding="md">
      <Group justify="space-between" align="flex-start">
        <Stack gap={4} style={{ flex: 1 }}>
          <Skeleton h={10} w={80} />
          <Skeleton h={20} w={60} />
          <Skeleton h={8} w={100} />
        </Stack>
        <Skeleton h={20} w={20} />
      </Group>
    </Card>
  )
}

function CapabilityCard({ capability, onClick }: { capability: DashboardCapability; onClick: () => void }) {
  const Icon = iconMap[capability.icon] ?? IconActivity
  const isActive = capability.status === "active"

  return (
    <Card withBorder padding="md" style={{ opacity: isActive ? 1 : 0.7, cursor: "pointer" }} onClick={onClick}>
      <Stack gap="xs">
        <Group justify="space-between">
          <Icon size={20} />
          <StatusBadge status={capability.status} />
        </Group>
        <Title order={5}>{capability.title}</Title>
        <Text size="sm" c="dimmed">
          {capability.description}
        </Text>
        <Group gap={4}>
          {capability.features.map((f) => (
            <Badge key={f} size="xs" variant="light">
              {f}
            </Badge>
          ))}
        </Group>
        {isActive && (
          <Button variant="subtle" size="xs" leftSection={<IconSettings size={12} />}>
            View Details
          </Button>
        )}
      </Stack>
    </Card>
  )
}

function CapabilityCardSkeleton() {
  return (
    <Card withBorder padding="md">
      <Stack gap="xs">
        <Group justify="space-between">
          <Skeleton h={20} w={20} />
          <Skeleton h={16} w={48} />
        </Group>
        <Skeleton h={16} w={120} />
        <Skeleton h={10} w="100%" />
        <Group gap={4}>
          <Skeleton h={14} w={40} />
          <Skeleton h={14} w={50} />
        </Group>
      </Stack>
    </Card>
  )
}

function CapabilityDetailsModal({
  details,
  isLoading,
  open,
  onClose,
}: {
  details: CapabilityDetails | null | undefined
  isLoading: boolean
  open: boolean
  onClose: () => void
}) {
  return (
    <Modal opened={open} onClose={onClose} title={details?.title ?? "Loading…"} size="md">
      {isLoading ? (
        <Stack align="center" py="md" gap="xs">
          <IconLoader2 />
          <Text size="sm" c="dimmed">
            Loading details…
          </Text>
        </Stack>
      ) : details ? (
        <Stack>
          <Text size="sm" c="dimmed">
            Version {details.version} · Updated {details.lastUpdated}
          </Text>
          <SimpleGrid cols={3}>
            <Card withBorder padding="sm" ta="center">
              <Title order={4}>{details.usageCount.toLocaleString()}</Title>
              <Text size="xs" c="dimmed">
                Requests
              </Text>
            </Card>
            <Card withBorder padding="sm" ta="center">
              <Title order={4}>{details.errorRate}</Title>
              <Text size="xs" c="dimmed">
                Error Rate
              </Text>
            </Card>
            <Card withBorder padding="sm" ta="center">
              <Title order={4}>{details.avgResponseTime}</Title>
              <Text size="xs" c="dimmed">
                Avg Latency
              </Text>
            </Card>
          </SimpleGrid>
          <Divider />
          <Title order={6}>Changelog</Title>
          <Stack gap="xs">
            {details.changelog.map((entry) => (
              <Stack key={entry.version} gap={2}>
                <Group gap="xs">
                  <Badge size="xs" variant="outline">
                    v{entry.version}
                  </Badge>
                  <Text size="xs" c="dimmed">
                    {entry.date}
                  </Text>
                </Group>
                <Text size="sm">{entry.summary}</Text>
              </Stack>
            ))}
          </Stack>
        </Stack>
      ) : (
        <Text size="sm" c="dimmed" ta="center" py="md">
          No details available.
        </Text>
      )}
    </Modal>
  )
}

function RouteComponent() {
  const { session } = Route.useRouteContext()
  const { data: dashboardData, isLoading } = useQuery(dashboardQueryOptions)
  const [selectedCapability, setSelectedCapability] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data: capabilityDetails, isLoading: isDetailsLoading } = useQuery({
    queryKey: dashboardKeys.capabilityDetails(selectedCapability!),
    queryFn: () => getCapabilityDetails({ data: { title: selectedCapability! } }),
    enabled: !!selectedCapability && dialogOpen,
  })

  const handleCapabilityClick = (title: string) => {
    setSelectedCapability(title)
    setDialogOpen(true)
  }

  return (
    <Container size="lg">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-end">
          <Stack gap={4}>
            <Group gap="xs" c="dimmed">
              <IconLayoutDashboard size={16} />
              <Text size="xs" tt="uppercase">
                Playground
              </Text>
            </Group>
            <Title order={2}>Welcome back, {session?.user.name ?? "Admin"}</Title>
            <Text size="sm" c="dimmed">
              Overview of your platform capabilities and system health.
            </Text>
          </Stack>
          <Button variant="default" leftSection={<IconSettings size={14} />}>
            Settings
          </Button>
        </Group>

        <Divider />

        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
            : dashboardData?.stats.map((stat) => <StatCard key={stat.label} stat={stat} />)}
        </SimpleGrid>

        <SimpleGrid cols={{ base: 1, lg: 3 }}>
          <Stack style={{ gridColumn: "span 2" }}>
            <Group justify="space-between">
              <Title order={5}>Platform Capabilities</Title>
              {dashboardData && (
                <Text size="xs" c="dimmed">
                  {dashboardData.capabilities.filter((c) => c.status === "active").length} active ·{" "}
                  {dashboardData.capabilities.filter((c) => c.status === "beta").length} in beta
                </Text>
              )}
            </Group>
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => <CapabilityCardSkeleton key={i} />)
                : dashboardData?.capabilities.map((cap) => (
                    <CapabilityCard key={cap.title} capability={cap} onClick={() => handleCapabilityClick(cap.title)} />
                  ))}
            </SimpleGrid>
          </Stack>

          <Stack>
            <Card withBorder>
              <Group gap="xs" mb="xs">
                <IconActivity size={14} />
                <Title order={6}>System Health</Title>
              </Group>
              <Text size="xs" c="dimmed" mb="md">
                Real-time resource utilization
              </Text>
              <Stack gap="xs">
                {isLoading
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <Stack key={i} gap={4}>
                        <Skeleton h={10} />
                        <Skeleton h={4} />
                      </Stack>
                    ))
                  : dashboardData?.systemHealth.map((metric) => (
                      <Stack key={metric.label} gap={4}>
                        <Group justify="space-between">
                          <Text size="xs" c="dimmed">
                            {metric.label}
                          </Text>
                          <Text size="xs">{metric.value}%</Text>
                        </Group>
                        <Progress value={metric.value} size="xs" />
                      </Stack>
                    ))}
              </Stack>
            </Card>

            <Card withBorder>
              <Group gap="xs" mb="md">
                <IconFileText size={14} />
                <Title order={6}>Recent Activity</Title>
              </Group>
              <Stack gap="xs">
                {isLoading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <Group key={i} justify="space-between">
                        <Stack gap={2} style={{ flex: 1 }}>
                          <Skeleton h={10} w="60%" />
                          <Skeleton h={8} w="80%" />
                        </Stack>
                        <Skeleton h={8} w={40} />
                      </Group>
                    ))
                  : dashboardData?.recentActivity.map((item, i) => (
                      <Group key={i} justify="space-between" wrap="nowrap">
                        <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
                          <Text size="xs" truncate>
                            {item.action}
                          </Text>
                          <Text size="xs" c="dimmed" truncate>
                            {item.detail}
                          </Text>
                        </Stack>
                        <Text size="xs" c="dimmed">
                          {item.time}
                        </Text>
                      </Group>
                    ))}
              </Stack>
            </Card>
          </Stack>
        </SimpleGrid>

        <CapabilityDetailsModal
          details={capabilityDetails}
          isLoading={isDetailsLoading}
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
        />
      </Stack>
    </Container>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/routes/_authenticated/playground.tsx
git commit -m "refactor(web): port playground dashboard to Mantine"
```

---

## Phase 5 — CRUD features

### Task 20: Migrate hair-assigned components

**Files:**
- Modify: `apps/web/src/components/hair-assigned/hair-assigned-table.tsx`
- Modify: `apps/web/src/components/hair-assigned/create-hair-assigned-dialog.tsx`
- Modify: `apps/web/src/components/hair-assigned/edit-hair-assigned-dialog.tsx`
- Modify: `apps/web/src/components/hair-assigned/delete-hair-assigned-dialog.tsx`

- [ ] **Step 1: Replace `hair-assigned-table.tsx`**

```tsx
import { ActionIcon, Group, Table, Text } from "@mantine/core"
import { IconPencil, IconTrash } from "@tabler/icons-react"
import { Link } from "@tanstack/react-router"

export type HairAssignedRow = {
  id: string
  weightInGrams: number
  soldFor: number
  profit: number
  pricePerGram: number
  client?: { id: string; name: string } | null
  hairOrder?: { id: string; uid: number } | null
}

type HairAssignedTableProps = {
  items: HairAssignedRow[]
  showHairOrderColumn?: boolean
  onEdit: (item: HairAssignedRow) => void
  onDelete: (item: HairAssignedRow) => void
}

const formatCents = (cents: number) => `$${(cents / 100).toFixed(2)}`

export function HairAssignedTable({ items, showHairOrderColumn = false, onEdit, onDelete }: HairAssignedTableProps) {
  if (items.length === 0) {
    return (
      <Text size="sm" c="dimmed">
        No hair assigned yet.
      </Text>
    )
  }

  return (
    <Table>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Client</Table.Th>
          {showHairOrderColumn && <Table.Th>Hair Order</Table.Th>}
          <Table.Th>Weight</Table.Th>
          <Table.Th>Sold For</Table.Th>
          <Table.Th>Profit</Table.Th>
          <Table.Th>$/g</Table.Th>
          <Table.Th />
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {items.map((ha) => {
          const needsAttention = ha.weightInGrams === 0 || ha.soldFor === 0
          return (
            <Table.Tr key={ha.id} bg={needsAttention ? "var(--mantine-color-red-0)" : undefined}>
              <Table.Td>
                {ha.client ? (
                  <Text component={Link} to="/customers/$customerId" params={{ customerId: ha.client.id }} c="blue">
                    {ha.client.name}
                  </Text>
                ) : (
                  "—"
                )}
              </Table.Td>
              {showHairOrderColumn && (
                <Table.Td>
                  {ha.hairOrder ? (
                    <Text
                      component={Link}
                      to="/hair-orders/$hairOrderId"
                      params={{ hairOrderId: ha.hairOrder.id }}
                      c="blue"
                    >
                      #{ha.hairOrder.uid}
                    </Text>
                  ) : (
                    "—"
                  )}
                </Table.Td>
              )}
              <Table.Td>{ha.weightInGrams}g</Table.Td>
              <Table.Td>{formatCents(ha.soldFor)}</Table.Td>
              <Table.Td>{formatCents(ha.profit)}</Table.Td>
              <Table.Td>{formatCents(ha.pricePerGram)}</Table.Td>
              <Table.Td>
                <Group gap={4}>
                  <ActionIcon variant="subtle" size="sm" onClick={() => onEdit(ha)} aria-label="Edit">
                    <IconPencil size={14} />
                  </ActionIcon>
                  <ActionIcon variant="subtle" size="sm" color="red" onClick={() => onDelete(ha)} aria-label="Delete">
                    <IconTrash size={14} />
                  </ActionIcon>
                </Group>
              </Table.Td>
            </Table.Tr>
          )
        })}
      </Table.Tbody>
    </Table>
  )
}
```

- [ ] **Step 2: Replace `create-hair-assigned-dialog.tsx`**

```tsx
import { Button, Group, Modal, Radio, Stack, Table, Text } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"

import { createHairAssigned, getAvailableHairOrders } from "@/functions/hair-assigned"
import { hairOrderKeys } from "@/lib/query-keys"

type CreateHairAssignedDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientId: string
  appointmentId?: string | null
  invalidateKeys: { queryKey: readonly unknown[] }[]
}

export function CreateHairAssignedDialog({
  open,
  onOpenChange,
  clientId,
  appointmentId,
  invalidateKeys,
}: CreateHairAssignedDialogProps) {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data: availableOrders, isLoading } = useQuery({
    queryKey: [...hairOrderKeys.all, "available"],
    queryFn: () => getAvailableHairOrders(),
    enabled: open,
  })

  const mutation = useMutation({
    mutationFn: (hairOrderId: string) =>
      createHairAssigned({ data: { hairOrderId, clientId, appointmentId: appointmentId ?? null } }),
    onSuccess: () => {
      for (const key of invalidateKeys) queryClient.invalidateQueries(key)
      queryClient.invalidateQueries({ queryKey: hairOrderKeys.all })
      onOpenChange(false)
      setSelectedOrderId(null)
      notifications.show({ color: "green", message: "Hair assigned created" })
    },
    onError: (error) => notifications.show({ color: "red", message: error.message }),
  })

  const handleClose = () => {
    setSelectedOrderId(null)
    onOpenChange(false)
  }

  return (
    <Modal opened={open} onClose={handleClose} title="Assign Hair" size="lg">
      <Stack>
        <Text size="sm" c="dimmed">
          Select a hair order with available stock.
        </Text>
        {isLoading ? (
          <Text size="sm" c="dimmed">
            Loading…
          </Text>
        ) : availableOrders && availableOrders.length > 0 ? (
          <Radio.Group value={selectedOrderId} onChange={setSelectedOrderId}>
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th />
                  <Table.Th>UID</Table.Th>
                  <Table.Th>Customer</Table.Th>
                  <Table.Th>Received</Table.Th>
                  <Table.Th>Remaining</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {availableOrders.map((order) => (
                  <Table.Tr key={order.id} onClick={() => setSelectedOrderId(order.id)} style={{ cursor: "pointer" }}>
                    <Table.Td>
                      <Radio value={order.id} />
                    </Table.Td>
                    <Table.Td>#{order.uid}</Table.Td>
                    <Table.Td>{order.customer.name}</Table.Td>
                    <Table.Td>{order.weightReceived}g</Table.Td>
                    <Table.Td>{order.weightReceived - order.weightUsed}g</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Radio.Group>
        ) : (
          <Text size="sm" c="dimmed">
            No hair orders with available stock.
          </Text>
        )}
        <Group justify="flex-end" gap="xs">
          <Button variant="default" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            disabled={!selectedOrderId}
            loading={mutation.isPending}
            onClick={() => selectedOrderId && mutation.mutate(selectedOrderId)}
          >
            Assign
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
```

- [ ] **Step 3: Replace `edit-hair-assigned-dialog.tsx`**

```tsx
import { Button, Group, Modal, NumberInput, Stack } from "@mantine/core"
import { useForm } from "@mantine/form"
import { notifications } from "@mantine/notifications"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { updateHairAssigned } from "@/functions/hair-assigned"
import { hairOrderKeys } from "@/lib/query-keys"

type EditHairAssignedDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  hairAssigned: { id: string; weightInGrams: number; soldFor: number }
  invalidateKeys: { queryKey: readonly unknown[] }[]
}

export function EditHairAssignedDialog({ open, onOpenChange, hairAssigned, invalidateKeys }: EditHairAssignedDialogProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (data: { id: string; weightInGrams: number; soldFor: number }) => updateHairAssigned({ data }),
    onSuccess: () => {
      for (const key of invalidateKeys) queryClient.invalidateQueries(key)
      queryClient.invalidateQueries({ queryKey: hairOrderKeys.all })
      onOpenChange(false)
      notifications.show({ color: "green", message: "Hair assigned updated" })
    },
    onError: (error) => notifications.show({ color: "red", message: error.message }),
  })

  const form = useForm({
    initialValues: { weightInGrams: hairAssigned.weightInGrams, soldFor: hairAssigned.soldFor },
  })

  const handleSubmit = async (values: { weightInGrams: number; soldFor: number }) => {
    await mutation.mutateAsync({ id: hairAssigned.id, ...values })
  }

  return (
    <Modal opened={open} onClose={() => onOpenChange(false)} title="Edit Hair Assigned">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <NumberInput label="Weight (grams)" min={0} {...form.getInputProps("weightInGrams")} />
          <NumberInput label="Sold For (cents)" min={0} {...form.getInputProps("soldFor")} />
          <Group justify="flex-end">
            <Button type="submit" loading={mutation.isPending}>
              Save Changes
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}
```

- [ ] **Step 4: Replace `delete-hair-assigned-dialog.tsx`**

```tsx
import { Button, Group, Modal, Stack, Text } from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { useMutation, useQueryClient } from "@tanstack/react-query"

import { deleteHairAssigned } from "@/functions/hair-assigned"
import { hairOrderKeys } from "@/lib/query-keys"

type DeleteHairAssignedDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  hairAssigned: {
    id: string
    weightInGrams: number
    client?: { name: string } | null
    hairOrder?: { uid: number } | null
  }
  invalidateKeys: { queryKey: readonly unknown[] }[]
}

export function DeleteHairAssignedDialog({
  open,
  onOpenChange,
  hairAssigned,
  invalidateKeys,
}: DeleteHairAssignedDialogProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => deleteHairAssigned({ data: { id: hairAssigned.id } }),
    onSuccess: () => {
      for (const key of invalidateKeys) queryClient.invalidateQueries(key)
      queryClient.invalidateQueries({ queryKey: hairOrderKeys.all })
      onOpenChange(false)
      notifications.show({ color: "green", message: "Hair assigned deleted" })
    },
    onError: (error) => notifications.show({ color: "red", message: error.message }),
  })

  return (
    <Modal opened={open} onClose={() => onOpenChange(false)} title="Delete Hair Assigned">
      <Stack>
        <Text size="sm">
          This will remove the assignment of {hairAssigned.weightInGrams}g
          {hairAssigned.client ? ` for ${hairAssigned.client.name}` : ""}
          {hairAssigned.hairOrder ? ` from order #${hairAssigned.hairOrder.uid}` : ""}. This action cannot be undone.
        </Text>
        <Group justify="flex-end" gap="xs">
          <Button variant="default" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button color="red" loading={mutation.isPending} onClick={() => mutation.mutate()}>
            Delete
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/hair-assigned
git commit -m "refactor(web): port hair-assigned components to Mantine"
```

---

### Task 21: Migrate customers routes

**Files:**
- Modify: `apps/web/src/routes/_authenticated/customers/index.tsx`
- Modify: `apps/web/src/routes/_authenticated/customers/$customerId.tsx`
- (`route.tsx` is already a pure `Outlet` — no change.)

- [ ] **Step 1: Replace `customers/index.tsx`**

```tsx
import { Button, Container, Group, Modal, Skeleton, Stack, Table, Text, TextInput, Title } from "@mantine/core"
import { useForm } from "@mantine/form"
import { notifications } from "@mantine/notifications"
import { IconPlus, IconUsers } from "@tabler/icons-react"
import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"
import { useState } from "react"

import { ClientDate } from "@/components/client-date"
import { createCustomer, getCustomers } from "@/functions/customers"
import { customerKeys } from "@/lib/query-keys"

const customersQueryOptions = queryOptions({
  queryKey: customerKeys.list(),
  queryFn: () => getCustomers(),
})

export const Route = createFileRoute("/_authenticated/customers/")({
  component: CustomersPage,
  loader: async ({ context }) => {
    await context.queryClient.prefetchQuery(customersQueryOptions)
  },
})

function CustomerFormDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (data: { name: string; phoneNumber: string | null }) => createCustomer({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.all })
      onOpenChange(false)
      notifications.show({ color: "green", message: "Customer created" })
    },
    onError: (error) => notifications.show({ color: "red", message: error.message }),
  })

  const form = useForm({ initialValues: { name: "", phoneNumber: "" } })

  const handleSubmit = async (values: { name: string; phoneNumber: string }) => {
    await mutation.mutateAsync({ name: values.name, phoneNumber: values.phoneNumber || null })
  }

  return (
    <Modal opened={open} onClose={() => onOpenChange(false)} title="New Customer">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput label="Name" {...form.getInputProps("name")} />
          <TextInput label="Phone Number" placeholder="+1234567890" {...form.getInputProps("phoneNumber")} />
          <Button type="submit" loading={mutation.isPending}>
            Create Customer
          </Button>
        </Stack>
      </form>
    </Modal>
  )
}

function CustomersPage() {
  const { data: customers, isLoading } = useQuery(customersQueryOptions)
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <Container size="lg">
      <Stack>
        <Group justify="space-between" align="flex-end">
          <Stack gap={4}>
            <Group gap="xs" c="dimmed">
              <IconUsers size={16} />
              <Text size="xs" tt="uppercase">
                Customers
              </Text>
            </Group>
            <Title order={2}>Customers</Title>
          </Stack>
          <Button leftSection={<IconPlus size={14} />} onClick={() => setDialogOpen(true)}>
            New Customer
          </Button>
        </Group>

        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Phone</Table.Th>
              <Table.Th>Created</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <Table.Tr key={i}>
                    <Table.Td>
                      <Skeleton h={14} w={120} />
                    </Table.Td>
                    <Table.Td>
                      <Skeleton h={14} w={90} />
                    </Table.Td>
                    <Table.Td>
                      <Skeleton h={14} w={70} />
                    </Table.Td>
                  </Table.Tr>
                ))
              : customers?.map((c) => (
                  <Table.Tr key={c.id}>
                    <Table.Td>
                      <Text component={Link} to="/customers/$customerId" params={{ customerId: c.id }} c="blue" fw={500}>
                        {c.name}
                      </Text>
                    </Table.Td>
                    <Table.Td c="dimmed">{c.phoneNumber ?? "—"}</Table.Td>
                    <Table.Td c="dimmed">
                      <ClientDate date={c.createdAt} />
                    </Table.Td>
                  </Table.Tr>
                ))}
            {!isLoading && customers?.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={3} ta="center" c="dimmed">
                  No customers yet. Create your first one.
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>

        <CustomerFormDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      </Stack>
    </Container>
  )
}
```

- [ ] **Step 2: Replace `customers/$customerId.tsx`**

```tsx
import { ActionIcon, Anchor, Button, Card, Container, Divider, Group, Modal, Skeleton, Stack, Table, Text, TextInput, Textarea, Title } from "@mantine/core"
import { useForm } from "@mantine/form"
import { notifications } from "@mantine/notifications"
import { IconArrowLeft, IconPencil, IconPhone, IconPlus, IconTrash } from "@tabler/icons-react"
import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"
import { useState } from "react"

import { ClientDate } from "@/components/client-date"
import { getAppointmentsByCustomerId } from "@/functions/appointments"
import { getCustomer, updateCustomer } from "@/functions/customers"
import { createNote, deleteNote, getNotes } from "@/functions/notes"
import { appointmentKeys, customerKeys, noteKeys } from "@/lib/query-keys"

export const Route = createFileRoute("/_authenticated/customers/$customerId")({
  component: CustomerDetailPage,
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.prefetchQuery(
        queryOptions({
          queryKey: customerKeys.detail(params.customerId),
          queryFn: () => getCustomer({ data: { id: params.customerId } }),
        }),
      ),
      context.queryClient.prefetchQuery(
        queryOptions({
          queryKey: appointmentKeys.byCustomer(params.customerId),
          queryFn: () => getAppointmentsByCustomerId({ data: { customerId: params.customerId } }),
        }),
      ),
      context.queryClient.prefetchQuery(
        queryOptions({
          queryKey: noteKeys.list({ customerId: params.customerId }),
          queryFn: () => getNotes({ data: { customerId: params.customerId } }),
        }),
      ),
    ])
  },
})

function EditCustomerDialog({
  customer,
  open,
  onOpenChange,
}: {
  customer: { id: string; name: string; phoneNumber: string | null }
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (data: { id: string; name: string; phoneNumber?: string | null }) => updateCustomer({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.all })
      onOpenChange(false)
      notifications.show({ color: "green", message: "Customer updated" })
    },
    onError: (error) => notifications.show({ color: "red", message: error.message }),
  })

  const form = useForm({
    initialValues: { name: customer.name, phoneNumber: customer.phoneNumber ?? "" },
  })

  const handleSubmit = async (values: { name: string; phoneNumber: string }) => {
    await mutation.mutateAsync({ id: customer.id, name: values.name, phoneNumber: values.phoneNumber || null })
  }

  return (
    <Modal opened={open} onClose={() => onOpenChange(false)} title="Edit Customer">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <TextInput label="Name" {...form.getInputProps("name")} />
          <TextInput label="Phone Number" placeholder="+1234567890" {...form.getInputProps("phoneNumber")} />
          <Button type="submit" loading={mutation.isPending}>
            Save Changes
          </Button>
        </Stack>
      </form>
    </Modal>
  )
}

function AddNoteDialog({
  customerId,
  open,
  onOpenChange,
}: {
  customerId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (data: { note: string; customerId: string }) => createNote({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: noteKeys.all })
      onOpenChange(false)
      notifications.show({ color: "green", message: "Note added" })
    },
    onError: (error) => notifications.show({ color: "red", message: error.message }),
  })

  const form = useForm({ initialValues: { note: "" } })

  const handleSubmit = async (values: { note: string }) => {
    await mutation.mutateAsync({ note: values.note, customerId })
  }

  return (
    <Modal opened={open} onClose={() => onOpenChange(false)} title="Add Note">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <Textarea label="Note" placeholder="Write a note…" minRows={3} {...form.getInputProps("note")} />
          <Button type="submit" loading={mutation.isPending}>
            Add Note
          </Button>
        </Stack>
      </form>
    </Modal>
  )
}

function CustomerDetailPage() {
  const { customerId } = Route.useParams()
  const [editOpen, setEditOpen] = useState(false)
  const [noteOpen, setNoteOpen] = useState(false)
  const queryClient = useQueryClient()

  const { data: customer, isLoading } = useQuery({
    queryKey: customerKeys.detail(customerId),
    queryFn: () => getCustomer({ data: { id: customerId } }),
  })

  const { data: appointments } = useQuery({
    queryKey: appointmentKeys.byCustomer(customerId),
    queryFn: () => getAppointmentsByCustomerId({ data: { customerId } }),
  })

  const { data: notes } = useQuery({
    queryKey: noteKeys.list({ customerId }),
    queryFn: () => getNotes({ data: { customerId } }),
  })

  const deleteNoteMutation = useMutation({
    mutationFn: (id: string) => deleteNote({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: noteKeys.all })
      notifications.show({ color: "green", message: "Note deleted" })
    },
  })

  if (isLoading) {
    return (
      <Container size="lg">
        <Stack>
          <Skeleton h={24} w={200} />
          <Skeleton h={120} />
        </Stack>
      </Container>
    )
  }

  if (!customer) {
    return (
      <Container size="lg">
        <Text c="dimmed">Customer not found.</Text>
      </Container>
    )
  }

  return (
    <Container size="lg">
      <Stack>
        <Group justify="space-between" align="flex-start">
          <Stack gap="xs">
            <Anchor component={Link} to="/customers" size="xs" c="dimmed">
              <Group gap={4}>
                <IconArrowLeft size={12} />
                Back to customers
              </Group>
            </Anchor>
            <Title order={2}>{customer.name}</Title>
            {customer.phoneNumber && (
              <Group gap={4} c="dimmed">
                <IconPhone size={12} />
                <Text size="sm">{customer.phoneNumber}</Text>
              </Group>
            )}
          </Stack>
          <Button variant="default" leftSection={<IconPencil size={14} />} onClick={() => setEditOpen(true)}>
            Edit
          </Button>
        </Group>

        <Divider />

        <Group grow align="flex-start">
          <Card withBorder>
            <Title order={5} mb="sm">
              Appointments
            </Title>
            {appointments && appointments.length > 0 ? (
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Name</Table.Th>
                    <Table.Th>Date</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {appointments.map((a) => (
                    <Table.Tr key={a.id}>
                      <Table.Td>
                        <Text component={Link} to="/appointments/$appointmentId" params={{ appointmentId: a.id }} c="blue">
                          {a.name}
                        </Text>
                      </Table.Td>
                      <Table.Td c="dimmed">
                        <ClientDate date={a.startsAt} />
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            ) : (
              <Text size="sm" c="dimmed">
                No appointments yet.
              </Text>
            )}
          </Card>

          <Card withBorder>
            <Group justify="space-between" mb="sm">
              <Title order={5}>Notes</Title>
              <Button variant="subtle" size="xs" leftSection={<IconPlus size={12} />} onClick={() => setNoteOpen(true)}>
                Add
              </Button>
            </Group>
            {notes && notes.length > 0 ? (
              <Stack gap="xs">
                {notes.map((n) => (
                  <Card key={n.id} withBorder padding="sm">
                    <Group justify="space-between" align="flex-start">
                      <Stack gap={2}>
                        <Text size="sm">{n.note}</Text>
                        <Text size="xs" c="dimmed">
                          {n.createdBy?.name ?? "Unknown"} · <ClientDate date={n.createdAt} />
                        </Text>
                      </Stack>
                      <ActionIcon variant="subtle" color="red" onClick={() => deleteNoteMutation.mutate(n.id)}>
                        <IconTrash size={14} />
                      </ActionIcon>
                    </Group>
                  </Card>
                ))}
              </Stack>
            ) : (
              <Text size="sm" c="dimmed">
                No notes yet.
              </Text>
            )}
          </Card>
        </Group>

        <EditCustomerDialog customer={customer} open={editOpen} onOpenChange={setEditOpen} />
        <AddNoteDialog customerId={customerId} open={noteOpen} onOpenChange={setNoteOpen} />
      </Stack>
    </Container>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/routes/_authenticated/customers
git commit -m "refactor(web): port customers routes to Mantine"
```

---

### Task 22: Migrate appointments routes

**Files:**
- Modify: `apps/web/src/routes/_authenticated/appointments/index.tsx`
- Modify: `apps/web/src/routes/_authenticated/appointments/$appointmentId.tsx`
- (`route.tsx` is already a pure `Outlet` — no change.)

- [ ] **Step 1: Replace `appointments/index.tsx`**

```tsx
import { Button, Container, Group, Modal, NativeSelect, Skeleton, Stack, Table, Text, TextInput, Title } from "@mantine/core"
import { useForm } from "@mantine/form"
import { notifications } from "@mantine/notifications"
import { IconCalendar, IconPlus } from "@tabler/icons-react"
import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"
import { useState } from "react"

import { ClientDate } from "@/components/client-date"
import { createAppointment, getAppointments } from "@/functions/appointments"
import { getCustomers } from "@/functions/customers"
import { appointmentKeys, customerKeys } from "@/lib/query-keys"

const appointmentsQueryOptions = queryOptions({
  queryKey: appointmentKeys.list(),
  queryFn: () => getAppointments({ data: {} }),
})

export const Route = createFileRoute("/_authenticated/appointments/")({
  component: AppointmentsPage,
  loader: async ({ context }) => {
    await context.queryClient.prefetchQuery(appointmentsQueryOptions)
  },
})

function CreateAppointmentDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient()

  const { data: customers } = useQuery({
    queryKey: customerKeys.list(),
    queryFn: () => getCustomers(),
  })

  const mutation = useMutation({
    mutationFn: (data: { name: string; startsAt: string; clientId: string }) => createAppointment({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.all })
      onOpenChange(false)
      notifications.show({ color: "green", message: "Appointment created" })
    },
    onError: (error) => notifications.show({ color: "red", message: error.message }),
  })

  const form = useForm({ initialValues: { name: "", startsAt: "", clientId: "" } })

  return (
    <Modal opened={open} onClose={() => onOpenChange(false)} title="New Appointment">
      <form onSubmit={form.onSubmit((values) => mutation.mutate(values))}>
        <Stack>
          <TextInput label="Name" {...form.getInputProps("name")} />
          <TextInput label="Date & Time" type="datetime-local" {...form.getInputProps("startsAt")} />
          <NativeSelect
            label="Client"
            data={[
              { value: "", label: "Select a client…" },
              ...(customers?.map((c) => ({ value: c.id, label: c.name })) ?? []),
            ]}
            {...form.getInputProps("clientId")}
          />
          <Button type="submit" loading={mutation.isPending}>
            Create Appointment
          </Button>
        </Stack>
      </form>
    </Modal>
  )
}

function AppointmentsPage() {
  const { data: appointments, isLoading } = useQuery(appointmentsQueryOptions)
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <Container size="lg">
      <Stack>
        <Group justify="space-between" align="flex-end">
          <Stack gap={4}>
            <Group gap="xs" c="dimmed">
              <IconCalendar size={16} />
              <Text size="xs" tt="uppercase">
                Appointments
              </Text>
            </Group>
            <Title order={2}>Appointments</Title>
          </Stack>
          <Button leftSection={<IconPlus size={14} />} onClick={() => setDialogOpen(true)}>
            New Appointment
          </Button>
        </Group>

        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Client</Table.Th>
              <Table.Th>Date</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <Table.Tr key={i}>
                    <Table.Td>
                      <Skeleton h={14} w={120} />
                    </Table.Td>
                    <Table.Td>
                      <Skeleton h={14} w={90} />
                    </Table.Td>
                    <Table.Td>
                      <Skeleton h={14} w={80} />
                    </Table.Td>
                  </Table.Tr>
                ))
              : appointments?.map((a) => (
                  <Table.Tr key={a.id}>
                    <Table.Td>
                      <Text component={Link} to="/appointments/$appointmentId" params={{ appointmentId: a.id }} c="blue" fw={500}>
                        {a.name}
                      </Text>
                    </Table.Td>
                    <Table.Td c="dimmed">{a.client?.name ?? "—"}</Table.Td>
                    <Table.Td c="dimmed">
                      <ClientDate date={a.startsAt} showTime />
                    </Table.Td>
                  </Table.Tr>
                ))}
            {!isLoading && appointments?.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={3} ta="center" c="dimmed">
                  No appointments yet.
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>

        <CreateAppointmentDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      </Stack>
    </Container>
  )
}
```

- [ ] **Step 2: Replace `appointments/$appointmentId.tsx`**

```tsx
import { Anchor, Button, Card, Container, Divider, Group, Skeleton, Stack, Text, Title } from "@mantine/core"
import { IconArrowLeft, IconClock, IconPlus, IconUser } from "@tabler/icons-react"
import { queryOptions, useQuery } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"
import { useState } from "react"

import { ClientDate } from "@/components/client-date"
import { CreateHairAssignedDialog } from "@/components/hair-assigned/create-hair-assigned-dialog"
import { DeleteHairAssignedDialog } from "@/components/hair-assigned/delete-hair-assigned-dialog"
import { EditHairAssignedDialog } from "@/components/hair-assigned/edit-hair-assigned-dialog"
import { HairAssignedTable, type HairAssignedRow } from "@/components/hair-assigned/hair-assigned-table"
import { getAppointment } from "@/functions/appointments"
import { getHairAssignedByAppointment } from "@/functions/hair-assigned"
import { appointmentKeys, hairAssignedKeys } from "@/lib/query-keys"

export const Route = createFileRoute("/_authenticated/appointments/$appointmentId")({
  component: AppointmentDetailPage,
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.prefetchQuery(
        queryOptions({
          queryKey: appointmentKeys.detail(params.appointmentId),
          queryFn: () => getAppointment({ data: { id: params.appointmentId } }),
        }),
      ),
      context.queryClient.prefetchQuery(
        queryOptions({
          queryKey: hairAssignedKeys.byAppointment(params.appointmentId),
          queryFn: () => getHairAssignedByAppointment({ data: { appointmentId: params.appointmentId } }),
        }),
      ),
    ])
  },
})

function AppointmentDetailPage() {
  const { appointmentId } = Route.useParams()
  const [createOpen, setCreateOpen] = useState(false)
  const [editItem, setEditItem] = useState<HairAssignedRow | null>(null)
  const [deleteItem, setDeleteItem] = useState<HairAssignedRow | null>(null)

  const { data: appointment, isLoading } = useQuery({
    queryKey: appointmentKeys.detail(appointmentId),
    queryFn: () => getAppointment({ data: { id: appointmentId } }),
  })

  const { data: hairAssigned } = useQuery({
    queryKey: hairAssignedKeys.byAppointment(appointmentId),
    queryFn: () => getHairAssignedByAppointment({ data: { appointmentId } }),
  })

  if (isLoading) {
    return (
      <Container size="lg">
        <Stack>
          <Skeleton h={24} w={200} />
          <Skeleton h={120} />
        </Stack>
      </Container>
    )
  }

  if (!appointment) {
    return (
      <Container size="lg">
        <Text c="dimmed">Appointment not found.</Text>
      </Container>
    )
  }

  const invalidateKeys = [
    { queryKey: appointmentKeys.detail(appointmentId) },
    { queryKey: hairAssignedKeys.byAppointment(appointmentId) },
  ]

  return (
    <Container size="lg">
      <Stack>
        <Stack gap="xs">
          <Anchor component={Link} to="/appointments" size="xs" c="dimmed">
            <Group gap={4}>
              <IconArrowLeft size={12} />
              Back to appointments
            </Group>
          </Anchor>
          <Title order={2}>{appointment.name}</Title>
          <Group gap="md" c="dimmed">
            <Group gap={4}>
              <IconClock size={12} />
              <Text size="sm">
                <ClientDate date={appointment.startsAt} showTime />
              </Text>
            </Group>
            <Group gap={4}>
              <IconUser size={12} />
              <Text component={Link} to="/customers/$customerId" params={{ customerId: appointment.client.id }} c="blue" size="sm">
                {appointment.client.name}
              </Text>
            </Group>
          </Group>
        </Stack>

        <Divider />

        <Group grow align="flex-start">
          <Card withBorder>
            <Title order={5} mb="sm">
              Personnel
            </Title>
            {appointment.personnel && appointment.personnel.length > 0 ? (
              <Stack gap="xs">
                {appointment.personnel.map((p) => (
                  <Card key={p.personnelId} withBorder padding="xs">
                    <Group gap="xs">
                      <IconUser size={12} />
                      <Text size="sm">{p.personnel.name}</Text>
                    </Group>
                  </Card>
                ))}
              </Stack>
            ) : (
              <Text size="sm" c="dimmed">
                No personnel assigned.
              </Text>
            )}
          </Card>

          <Card withBorder>
            <Group justify="space-between" mb="sm">
              <Title order={5}>Hair Assigned</Title>
              <Button variant="subtle" size="xs" leftSection={<IconPlus size={12} />} onClick={() => setCreateOpen(true)}>
                Add
              </Button>
            </Group>
            <HairAssignedTable
              items={hairAssigned ?? []}
              showHairOrderColumn
              onEdit={setEditItem}
              onDelete={setDeleteItem}
            />
          </Card>
        </Group>

        <Card withBorder>
          <Title order={5} mb="sm">
            Notes
          </Title>
          {appointment.notes && appointment.notes.length > 0 ? (
            <Stack gap="xs">
              {appointment.notes.map((n) => (
                <Card key={n.id} withBorder padding="sm">
                  <Text size="sm">{n.note}</Text>
                  <Text size="xs" c="dimmed" mt={4}>
                    {n.createdBy?.name ?? "Unknown"} · <ClientDate date={n.createdAt} />
                  </Text>
                </Card>
              ))}
            </Stack>
          ) : (
            <Text size="sm" c="dimmed">
              No notes.
            </Text>
          )}
        </Card>

        <CreateHairAssignedDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          clientId={appointment.client.id}
          appointmentId={appointmentId}
          invalidateKeys={invalidateKeys}
        />
        {editItem && (
          <EditHairAssignedDialog
            open={!!editItem}
            onOpenChange={(open) => !open && setEditItem(null)}
            hairAssigned={editItem}
            invalidateKeys={invalidateKeys}
          />
        )}
        {deleteItem && (
          <DeleteHairAssignedDialog
            open={!!deleteItem}
            onOpenChange={(open) => !open && setDeleteItem(null)}
            hairAssigned={deleteItem}
            invalidateKeys={invalidateKeys}
          />
        )}
      </Stack>
    </Container>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/routes/_authenticated/appointments
git commit -m "refactor(web): port appointments routes to Mantine"
```

---

### Task 23: Migrate hair-orders routes

**Files:**
- Modify: `apps/web/src/routes/_authenticated/hair-orders/index.tsx`
- Modify: `apps/web/src/routes/_authenticated/hair-orders/$hairOrderId.tsx`
- (`route.tsx` is already a pure `Outlet` — no change.)

- [ ] **Step 1: Replace `hair-orders/index.tsx`**

```tsx
import { Badge, Button, Container, Group, Modal, NativeSelect, NumberInput, Skeleton, Stack, Table, Text, TextInput, Title } from "@mantine/core"
import { useForm } from "@mantine/form"
import { notifications } from "@mantine/notifications"
import { IconPlus, IconScissors } from "@tabler/icons-react"
import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"
import { useState } from "react"

import { ClientDate } from "@/components/client-date"
import { getCustomers } from "@/functions/customers"
import { createHairOrder, getHairOrders } from "@/functions/hair-orders"
import { customerKeys, hairOrderKeys } from "@/lib/query-keys"

const hairOrdersQueryOptions = queryOptions({
  queryKey: hairOrderKeys.list(),
  queryFn: () => getHairOrders(),
})

export const Route = createFileRoute("/_authenticated/hair-orders/")({
  component: HairOrdersPage,
  loader: async ({ context }) => {
    await context.queryClient.prefetchQuery(hairOrdersQueryOptions)
  },
})

function CreateHairOrderDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient()

  const { data: customers } = useQuery({
    queryKey: customerKeys.list(),
    queryFn: () => getCustomers(),
  })

  const mutation = useMutation({
    mutationFn: (data: {
      customerId: string
      placedAt: string | null
      arrivedAt: string | null
      status: "PENDING" | "COMPLETED"
      weightReceived: number
      weightUsed: number
      total: number
    }) => createHairOrder({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hairOrderKeys.all })
      onOpenChange(false)
      notifications.show({ color: "green", message: "Hair order created" })
    },
    onError: (error) => notifications.show({ color: "red", message: error.message }),
  })

  const form = useForm({
    initialValues: { customerId: "", placedAt: "", weightReceived: 0, total: 0 },
  })

  const handleSubmit = async (values: { customerId: string; placedAt: string; weightReceived: number; total: number }) => {
    await mutation.mutateAsync({
      customerId: values.customerId,
      placedAt: values.placedAt || null,
      arrivedAt: null,
      status: "PENDING",
      weightReceived: values.weightReceived,
      weightUsed: 0,
      total: values.total,
    })
  }

  return (
    <Modal opened={open} onClose={() => onOpenChange(false)} title="New Hair Order">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack>
          <NativeSelect
            label="Customer"
            data={[
              { value: "", label: "Select a customer…" },
              ...(customers?.map((c) => ({ value: c.id, label: c.name })) ?? []),
            ]}
            {...form.getInputProps("customerId")}
          />
          <TextInput label="Placed At" type="date" {...form.getInputProps("placedAt")} />
          <Group grow>
            <NumberInput label="Weight (g)" min={0} {...form.getInputProps("weightReceived")} />
            <NumberInput label="Total (cents)" min={0} {...form.getInputProps("total")} />
          </Group>
          <Button type="submit" loading={mutation.isPending}>
            Create Hair Order
          </Button>
        </Stack>
      </form>
    </Modal>
  )
}

function HairOrdersPage() {
  const { data: hairOrders, isLoading } = useQuery(hairOrdersQueryOptions)
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <Container size="lg">
      <Stack>
        <Group justify="space-between" align="flex-end">
          <Stack gap={4}>
            <Group gap="xs" c="dimmed">
              <IconScissors size={16} />
              <Text size="xs" tt="uppercase">
                Hair Orders
              </Text>
            </Group>
            <Title order={2}>Hair Orders</Title>
          </Stack>
          <Button leftSection={<IconPlus size={14} />} onClick={() => setDialogOpen(true)}>
            New Order
          </Button>
        </Group>

        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>#</Table.Th>
              <Table.Th>Customer</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Weight (g)</Table.Th>
              <Table.Th>Placed</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <Table.Tr key={i}>
                    <Table.Td>
                      <Skeleton h={14} w={30} />
                    </Table.Td>
                    <Table.Td>
                      <Skeleton h={14} w={90} />
                    </Table.Td>
                    <Table.Td>
                      <Skeleton h={14} w={60} />
                    </Table.Td>
                    <Table.Td>
                      <Skeleton h={14} w={50} />
                    </Table.Td>
                    <Table.Td>
                      <Skeleton h={14} w={70} />
                    </Table.Td>
                  </Table.Tr>
                ))
              : hairOrders?.map((ho) => (
                  <Table.Tr key={ho.id}>
                    <Table.Td>
                      <Text component={Link} to="/hair-orders/$hairOrderId" params={{ hairOrderId: ho.id }} c="blue" fw={500}>
                        #{ho.uid}
                      </Text>
                    </Table.Td>
                    <Table.Td c="dimmed">{ho.customer?.name ?? "—"}</Table.Td>
                    <Table.Td>
                      <Badge variant={ho.status === "COMPLETED" ? "light" : "outline"}>{ho.status}</Badge>
                    </Table.Td>
                    <Table.Td c="dimmed">{ho.weightReceived}g</Table.Td>
                    <Table.Td c="dimmed">{ho.placedAt ? <ClientDate date={ho.placedAt} /> : "—"}</Table.Td>
                  </Table.Tr>
                ))}
            {!isLoading && hairOrders?.length === 0 && (
              <Table.Tr>
                <Table.Td colSpan={5} ta="center" c="dimmed">
                  No hair orders yet.
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>

        <CreateHairOrderDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      </Stack>
    </Container>
  )
}
```

- [ ] **Step 2: Replace `hair-orders/$hairOrderId.tsx`**

```tsx
import { Anchor, Badge, Button, Card, Container, Divider, Group, SimpleGrid, Skeleton, Stack, Text, Title } from "@mantine/core"
import { IconArrowLeft, IconPlus, IconUser } from "@tabler/icons-react"
import { queryOptions, useQuery } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"
import { useState } from "react"

import { ClientDate } from "@/components/client-date"
import { CreateHairAssignedDialog } from "@/components/hair-assigned/create-hair-assigned-dialog"
import { DeleteHairAssignedDialog } from "@/components/hair-assigned/delete-hair-assigned-dialog"
import { EditHairAssignedDialog } from "@/components/hair-assigned/edit-hair-assigned-dialog"
import { HairAssignedTable, type HairAssignedRow } from "@/components/hair-assigned/hair-assigned-table"
import { getHairOrder } from "@/functions/hair-orders"
import { hairOrderKeys } from "@/lib/query-keys"

export const Route = createFileRoute("/_authenticated/hair-orders/$hairOrderId")({
  component: HairOrderDetailPage,
  loader: async ({ context, params }) => {
    await context.queryClient.prefetchQuery(
      queryOptions({
        queryKey: hairOrderKeys.detail(params.hairOrderId),
        queryFn: () => getHairOrder({ data: { id: params.hairOrderId } }),
      }),
    )
  },
})

const formatCents = (cents: number) => `$${(cents / 100).toFixed(2)}`

function HairOrderDetailPage() {
  const { hairOrderId } = Route.useParams()
  const [createOpen, setCreateOpen] = useState(false)
  const [editItem, setEditItem] = useState<HairAssignedRow | null>(null)
  const [deleteItem, setDeleteItem] = useState<HairAssignedRow | null>(null)

  const { data: hairOrder, isLoading } = useQuery({
    queryKey: hairOrderKeys.detail(hairOrderId),
    queryFn: () => getHairOrder({ data: { id: hairOrderId } }),
  })

  if (isLoading) {
    return (
      <Container size="lg">
        <Stack>
          <Skeleton h={24} w={200} />
          <Skeleton h={120} />
        </Stack>
      </Container>
    )
  }

  if (!hairOrder) {
    return (
      <Container size="lg">
        <Text c="dimmed">Hair order not found.</Text>
      </Container>
    )
  }

  const invalidateKeys = [{ queryKey: hairOrderKeys.detail(hairOrderId) }]

  return (
    <Container size="lg">
      <Stack>
        <Stack gap="xs">
          <Anchor component={Link} to="/hair-orders" size="xs" c="dimmed">
            <Group gap={4}>
              <IconArrowLeft size={12} />
              Back to hair orders
            </Group>
          </Anchor>
          <Group gap="md">
            <Title order={2}>Hair Order #{hairOrder.uid}</Title>
            <Badge variant={hairOrder.status === "COMPLETED" ? "light" : "outline"}>{hairOrder.status}</Badge>
          </Group>
          <Group gap="md" c="dimmed">
            <Group gap={4}>
              <IconUser size={12} />
              <Text component={Link} to="/customers/$customerId" params={{ customerId: hairOrder.customer.id }} c="blue" size="sm">
                {hairOrder.customer.name}
              </Text>
            </Group>
            <Text size="sm">Created by {hairOrder.createdBy?.name ?? "Unknown"}</Text>
          </Group>
        </Stack>

        <Divider />

        <SimpleGrid cols={{ base: 2, md: 4 }}>
          <Card withBorder padding="md">
            <Text size="xs" c="dimmed">
              Weight Received
            </Text>
            <Title order={4}>{hairOrder.weightReceived}g</Title>
          </Card>
          <Card withBorder padding="md">
            <Text size="xs" c="dimmed">
              Weight Used
            </Text>
            <Title order={4}>{hairOrder.weightUsed}g</Title>
          </Card>
          <Card withBorder padding="md">
            <Text size="xs" c="dimmed">
              Price/Gram
            </Text>
            <Title order={4}>{formatCents(hairOrder.pricePerGram)}</Title>
          </Card>
          <Card withBorder padding="md">
            <Text size="xs" c="dimmed">
              Total
            </Text>
            <Title order={4}>{formatCents(hairOrder.total)}</Title>
          </Card>
        </SimpleGrid>

        <Group grow align="flex-start">
          <Card withBorder>
            <Group justify="space-between" mb="sm">
              <Title order={5}>Hair Assigned</Title>
              <Button variant="subtle" size="xs" leftSection={<IconPlus size={12} />} onClick={() => setCreateOpen(true)}>
                Add
              </Button>
            </Group>
            <HairAssignedTable items={hairOrder.hairAssigned ?? []} onEdit={setEditItem} onDelete={setDeleteItem} />
          </Card>

          <Card withBorder>
            <Title order={5} mb="sm">
              Notes
            </Title>
            {hairOrder.notes && hairOrder.notes.length > 0 ? (
              <Stack gap="xs">
                {hairOrder.notes.map((n) => (
                  <Card key={n.id} withBorder padding="sm">
                    <Text size="sm">{n.note}</Text>
                    <Text size="xs" c="dimmed" mt={4}>
                      {n.createdBy?.name ?? "Unknown"} · <ClientDate date={n.createdAt} />
                    </Text>
                  </Card>
                ))}
              </Stack>
            ) : (
              <Text size="sm" c="dimmed">
                No notes.
              </Text>
            )}
          </Card>
        </Group>

        <CreateHairAssignedDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          clientId={hairOrder.customer.id}
          invalidateKeys={invalidateKeys}
        />
        {editItem && (
          <EditHairAssignedDialog
            open={!!editItem}
            onOpenChange={(open) => !open && setEditItem(null)}
            hairAssigned={editItem}
            invalidateKeys={invalidateKeys}
          />
        )}
        {deleteItem && (
          <DeleteHairAssignedDialog
            open={!!deleteItem}
            onOpenChange={(open) => !open && setDeleteItem(null)}
            hairAssigned={deleteItem}
            invalidateKeys={invalidateKeys}
          />
        )}
      </Stack>
    </Container>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/routes/_authenticated/hair-orders
git commit -m "refactor(web): port hair-orders routes to Mantine"
```

---

## Phase 6 — Verify & cleanup

### Task 24: Final verification & cleanup

**Files:** none (verification only).

- [ ] **Step 1: Sweep for any remaining shadcn/Tailwind references**

```bash
cd /Users/mselvenis/dev/prive-admin
grep -rn --include='*.ts' --include='*.tsx' --include='*.css' \
  -E "@prive-admin-tanstack/ui/components|@prive-admin-tanstack/ui/lib|lucide-react|sonner|next-themes|tw-animate-css|@base-ui/react|class-variance-authority|@/lib/utils|tailwind-merge" \
  apps packages
```
Expected: no matches.

```bash
grep -rn --include='*.tsx' --include='*.ts' \
  -E '"dark:|className=".*\b(dark:|bg-background|text-foreground|text-muted-foreground|bg-card|border-border|bg-primary|text-primary)' \
  apps packages
```
Expected: no matches. If any appear, port that file to Mantine.

- [ ] **Step 2: Run type-check across the workspace**

```bash
cd /Users/mselvenis/dev/prive-admin && bun run check-types
```
Expected: PASS, no errors.

- [ ] **Step 3: Run lint + format**

```bash
cd /Users/mselvenis/dev/prive-admin && bun run check
```
Expected: clean output.

- [ ] **Step 4: Boot the dev server and click through every route**

```bash
cd /Users/mselvenis/dev/prive-admin && bun run dev:web
```

Then in a browser at `http://localhost:3001`:
- `/` — landing page renders, color-scheme toggle works.
- `/login` — sign-up form appears by default; switching to sign-in works; both submit correctly. Test with valid + invalid credentials.
- After login, `/customers` — list renders, create dialog works.
- `/customers/<id>` — detail page renders, edit dialog works, add note works, delete note works.
- `/appointments` — list renders, create dialog works.
- `/appointments/<id>` — detail renders, hair-assigned create/edit/delete dialogs all work.
- `/hair-orders` — list renders, create dialog works.
- `/hair-orders/<id>` — detail renders, hair-assigned create/edit/delete dialogs all work.
- `/playground` — dashboard renders, capability click opens modal with detail content.
- `/files` — file list loads, drag-and-drop upload works, progress badges appear.
- `/files-direct` — same as `/files`, presigned upload path works.
- `/settings` — locale + timezone shown.
- Toggle color scheme between light / dark / auto on at least 3 pages.
- Sign out from the header user menu, return to landing.

- [ ] **Step 5: If any commits remain, push the branch**

```bash
git status
git log --oneline -25
```

Expected: working tree clean; 24+ commits added on `tanstack-rewrite-mantine` since the spec commit.

If a defect surfaced during click-through, fix it as a focused commit (don't amend earlier ones).

- [ ] **Step 6: Final commit if anything was found**

If step 1 or 4 surfaced issues, commit fixes:

```bash
git add <fixed-files>
git commit -m "fix(web): <specific fix>"
```

If everything passed, no final commit is needed.

---

## Self-review checklist (already run)

- **Spec coverage:** Every spec section maps to a task — UI package rewrite (Tasks 2–3), build config (Tasks 4–5), `__root.tsx` (Task 6), header + toggle (Task 9), forms port (Tasks 10–11), AppShell (Task 14), every route (Tasks 12–23), file upload (Tasks 17–18), notifications swap (every task using `notifications.show`), library swaps (Tasks 1, 4).
- **Placeholders:** none.
- **Type consistency:** dialog prop names (`open`/`onOpenChange`) preserved exactly to avoid breaking call-sites in `appointments/$appointmentId.tsx` and `hair-orders/$hairOrderId.tsx`. `HairAssignedRow` shape unchanged.
- **Out-of-scope guardrails:** server functions, drizzle schema, query keys, auth, router config — none touched.
