# Atelier Ledger Admin UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the authenticated left-sidebar dashboard with the Atelier Ledger top-header UI and refine shared page surfaces for responsive admin workflows.

**Architecture:** Extract global navigation data and active-route matching into a pure helper, then rebuild the authenticated `AppShell` around a desktop two-tier header and mobile drawer. Keep route behavior, data loading, legal entity tabs, and Mantine as-is while improving shared `PageHeader`, `Section`, and filter/table layouts.

**Tech Stack:** React, TanStack Router, TanStack Query, Mantine 9, Tabler Icons, Vite+, Vitest.

**Revision:** After implementation review, the visual direction was lightened to follow Mantine's `HeaderTabs` example more closely. The final shell uses a simple raised active tab and no separate ledger rule/status band.

## Global Constraints

- Work on branch `feat/atelier-ledger-admin-ui`.
- No API, database, authentication, or route behavior changes.
- Preserve TanStack Router `Link`, current path active matching, and existing query loading behavior.
- Existing legal entity navigation helpers remain the source of truth for legal entity section paths.
- Keep Settings reachable as a visible global navigation item.
- Keep the unassigned documents badge on Legal entities.
- Mobile navigation uses a drawer grouped as Workspace, Manage, Account.
- Run `vp check` and `vp test` after implementation.

---

## File Structure

- Create `apps/web/src/lib/app-navigation.ts` for global nav groups, route metadata, and active-route matching.
- Create `apps/web/src/lib/app-navigation.test.ts` for Vitest coverage of active matching and badge-bearing nav entries.
- Modify `apps/web/src/routes/_authenticated/route.tsx` to replace the sidebar shell with the two-tier header and mobile drawer.
- Modify `apps/web/src/routes/_authenticated/route.module.css` for the Atelier Ledger header, tabs, drawer links, active states, and responsive behavior.
- Modify `apps/web/src/components/page-header.tsx` so actions wrap below titles on mobile and stay right-aligned on desktop.
- Modify `apps/web/src/components/section.tsx` so shared surfaces are flatter and can mark table/filter content consistently.
- Modify `packages/ui/src/theme.ts` and `packages/ui/src/styles/globals.css` only for shared token/radius/shadow refinements needed by the new shell.
- Modify `apps/web/src/routes/_authenticated/dashboard.tsx`, `customers/index.tsx`, `cash.tsx`, `hair-orders/index.tsx`, and `legal-entities/$legalEntityId/route.tsx` for focused layout cleanup.

---

### Task 1: Navigation Model

**Files:**
- Create: `apps/web/src/lib/app-navigation.ts`
- Create: `apps/web/src/lib/app-navigation.test.ts`

**Interfaces:**
- Produces: `type AppNavItem`, `type AppNavGroup`, `appNavGroups`, `flatAppNavItems`, `getActiveAppNavItem(pathname: string): AppNavItem`
- Consumes: no prior task output

- [ ] **Step 1: Write the failing test**

Create `apps/web/src/lib/app-navigation.test.ts`:

```ts
import { describe, expect, it } from "vitest"

import { appNavGroups, flatAppNavItems, getActiveAppNavItem } from "./app-navigation"

describe("app navigation", () => {
  it("keeps settings as a visible account navigation item", () => {
    expect(appNavGroups.find((group) => group.label === "Account")?.items.map((item) => item.to)).toContain(
      "/settings",
    )
  })

  it("marks nested routes by their parent navigation item", () => {
    expect(getActiveAppNavItem("/customers/123")?.to).toBe("/customers")
    expect(getActiveAppNavItem("/legal-entities/entity-1/documents")?.to).toBe("/legal-entities")
    expect(getActiveAppNavItem("/hair-orders/order-1")?.to).toBe("/hair-orders")
  })

  it("keeps the unassigned badge on legal entities", () => {
    expect(flatAppNavItems.find((item) => item.to === "/legal-entities")?.badgeKey).toBe("unassigned")
  })
})
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `vp test apps/web/src/lib/app-navigation.test.ts`

Expected: FAIL because `apps/web/src/lib/app-navigation.ts` does not exist.

- [ ] **Step 3: Implement the navigation helper**

Create `apps/web/src/lib/app-navigation.ts`:

```ts
import {
  IconBuildingBank,
  IconCalendar,
  IconCash,
  IconLayoutDashboard,
  IconReceipt,
  IconScissors,
  IconSettings,
  IconUsers,
} from "@tabler/icons-react"

export type AppNavBadgeKey = "unassigned"

export type AppNavItem = {
  to: string
  label: string
  shortLabel?: string
  icon: typeof IconUsers
  badgeKey?: AppNavBadgeKey
}

export type AppNavGroup = {
  label: "Workspace" | "Manage" | "Account"
  items: AppNavItem[]
}

export const appNavGroups: AppNavGroup[] = [
  {
    label: "Workspace",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: IconLayoutDashboard },
      { to: "/customers", label: "Customers", icon: IconUsers },
      { to: "/calendar", label: "Calendar", icon: IconCalendar },
      { to: "/hair-orders", label: "Hair orders", shortLabel: "Orders", icon: IconScissors },
      { to: "/hair-sales", label: "Hair sales", shortLabel: "Sales", icon: IconReceipt },
      { to: "/cash", label: "Cash", icon: IconCash },
    ],
  },
  {
    label: "Manage",
    items: [
      {
        to: "/legal-entities",
        label: "Legal entities",
        shortLabel: "Entities",
        icon: IconBuildingBank,
        badgeKey: "unassigned",
      },
    ],
  },
  {
    label: "Account",
    items: [{ to: "/settings", label: "Settings", icon: IconSettings }],
  },
]

export const flatAppNavItems = appNavGroups.flatMap((group) => group.items)

export function getActiveAppNavItem(pathname: string) {
  return flatAppNavItems.find((item) => pathname === item.to || pathname.startsWith(`${item.to}/`))
}
```

- [ ] **Step 4: Run the focused test and verify it passes**

Run: `vp test apps/web/src/lib/app-navigation.test.ts`

Expected: PASS for all tests in `app-navigation.test.ts`.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/app-navigation.ts apps/web/src/lib/app-navigation.test.ts
git commit -m "feat: add app navigation model"
```

---

### Task 2: Authenticated Top Header Shell

**Files:**
- Modify: `apps/web/src/routes/_authenticated/route.tsx`
- Modify: `apps/web/src/routes/_authenticated/route.module.css`

**Interfaces:**
- Consumes: `appNavGroups`, `flatAppNavItems`, `getActiveAppNavItem`
- Produces: desktop two-tier header, mobile drawer, ledger rule bar, global active states

- [ ] **Step 1: Replace local nav arrays with the navigation helper**

In `apps/web/src/routes/_authenticated/route.tsx`, remove local `NavItem`, `workspaceNav`, `manageNav`, and `footerNav`. Import:

```ts
import { Drawer } from "@mantine/core"
import { appNavGroups, flatAppNavItems, getActiveAppNavItem, type AppNavItem } from "@/lib/app-navigation"
```

Keep existing imports for Mantine components, hooks, auth, router, and Tabler icons that remain in use.

- [ ] **Step 2: Rebuild `AuthenticatedLayout` around header-only AppShell**

Update the `AppShell` configuration:

```tsx
<AppShell header={{ height: { base: 64, sm: 112 } }} padding={0}>
  <AppShell.Header className={classes.header}>
    <HeaderTop opened={mobileOpened} onToggle={toggleMobile} />
    <DesktopTabs badges={badges} />
    <LedgerRule activeLabel={activeItem?.label ?? "Admin"} activeBadge={activeBadge} />
  </AppShell.Header>
  <MobileNavigationDrawer opened={mobileOpened} onClose={closeMobile} badges={badges} />
  <AppShell.Main className={classes.main}>
    <Outlet />
  </AppShell.Main>
</AppShell>
```

Derive `activeItem` with `getActiveAppNavItem(useLocation().pathname)`. Derive `activeBadge` from `activeItem.badgeKey`.

- [ ] **Step 3: Add focused shell components**

Add these components in `route.tsx` below `AuthenticatedLayout`: `HeaderTop`, `DesktopTabs`, `LedgerRule`, `MobileNavigationDrawer`, `DrawerNavGroup`, and `NavLinkButton`. Use `UnstyledButton` with `component={Link}` for links, `ActionIcon` for icon-only controls, and existing `UserSection` plus `ColorSchemeToggle` for utilities. Drawer links call `onClose` after navigation.

- [ ] **Step 4: Update shell CSS**

Replace sidebar-focused CSS in `route.module.css` with classes for:

```css
.header {}
.topRow {}
.tabsRow {}
.ledgerRule {}
.desktopNavLink {}
.drawerNavLink {}
.navLinkIcon {}
.brand {}
.main {}
.user {}
.userActive {}
```

Requirements:

- `.topRow` is 56px tall on desktop and 64px on mobile.
- `.tabsRow` is hidden below Mantine `sm`.
- `.ledgerRule` is hidden below Mantine `sm`.
- `.main` uses `min-height: 100vh`, `padding: var(--mantine-spacing-lg) 0 var(--mantine-spacing-xl)`, and transparent background.
- Active nav links use a champagne border or underline plus strong text color.
- Hover states do not move layout dimensions.

- [ ] **Step 5: Run type checking for shell changes**

Run: `vp run --filter web check-types`

Expected: PASS with no TypeScript errors.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/routes/_authenticated/route.tsx apps/web/src/routes/_authenticated/route.module.css
git commit -m "feat: redesign authenticated app shell"
```

---

### Task 3: Shared Page Surfaces

**Files:**
- Modify: `apps/web/src/components/page-header.tsx`
- Modify: `apps/web/src/components/section.tsx`
- Modify: `packages/ui/src/theme.ts`
- Modify: `packages/ui/src/styles/globals.css`

**Interfaces:**
- Consumes: shell spacing from Task 2
- Produces: denser `PageHeader`, flatter `Section`, tighter shared card/paper treatment

- [ ] **Step 1: Update `PageHeader` responsive action layout**

Modify `PageHeader` so the root `Group` keeps the title and actions aligned on desktop, while the actions receive full width on mobile:

```tsx
<Group justify="space-between" align="flex-start" wrap="wrap" mb="lg" gap="md">
  <Stack gap={4} miw={0} flex="1 1 22rem">
    <Title order={2} fw={600} lh={1.2}>
      {title}
    </Title>
    {description ? (
      <Box c="dimmed" fz="sm">
        {description}
      </Box>
    ) : null}
  </Stack>
  {actions ? (
    <Group gap="xs" wrap="wrap" justify={{ base: "flex-start", sm: "flex-end" }} w={{ base: "100%", sm: "auto" }}>
      {actions}
    </Group>
  ) : null}
</Group>
```

- [ ] **Step 2: Update `Section` surface behavior**

Modify `Section` so the card uses a class hook and header actions can wrap on narrow screens:

```tsx
<Card padding={0} className="prive-section">
  {hasHeader ? (
    <>
      <Group justify="space-between" align="flex-start" wrap="wrap" p="lg" pb="md" gap="md">
        <Stack gap={2} miw={0} flex="1 1 18rem">
          {title ? (
            <Title order={4} fw={600} lh={1.3}>
              {title}
            </Title>
          ) : null}
          {description ? (
            <Box c="dimmed" fz="sm">
              {description}
            </Box>
          ) : null}
        </Stack>
        {actions ? (
          <Group gap="xs" wrap="wrap" justify={{ base: "flex-start", sm: "flex-end" }}>
            {actions}
          </Group>
        ) : null}
      </Group>
      <Divider />
    </>
  ) : null}
  <Box p={padding} className="prive-section-body">
    {children}
  </Box>
</Card>
```

- [ ] **Step 3: Flatten shared surfaces**

In `packages/ui/src/theme.ts`, change default `Card` and `Paper` radius from `xl` to `md`, keep `withBorder`, and reduce default card shadow to `xs`.

In `packages/ui/src/styles/globals.css`, add:

```css
.prive-section {
  overflow: hidden;
}

.prive-section-body {
  min-width: 0;
}

[class^="mantine-Table-ScrollContainer-root"],
[class*=" mantine-Table-ScrollContainer-root"] {
  border-color: var(--prive-border);
}
```

- [ ] **Step 4: Run type checking**

Run: `vp run --filter web check-types`

Expected: PASS with no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/page-header.tsx apps/web/src/components/section.tsx packages/ui/src/theme.ts packages/ui/src/styles/globals.css
git commit -m "feat: refine admin page surfaces"
```

---

### Task 4: Focused Page Layout Cleanup

**Files:**
- Modify: `apps/web/src/routes/_authenticated/dashboard.tsx`
- Modify: `apps/web/src/routes/_authenticated/customers/index.tsx`
- Modify: `apps/web/src/routes/_authenticated/cash.tsx`
- Modify: `apps/web/src/routes/_authenticated/hair-orders/index.tsx`
- Modify: `apps/web/src/routes/_authenticated/legal-entities/$legalEntityId/route.tsx`

**Interfaces:**
- Consumes: shared `PageHeader` and `Section` behavior from Task 3
- Produces: page-level responsive wrapping aligned with the new shell

- [ ] **Step 1: Wrap table-heavy content in `Table.ScrollContainer`**

For Customers, Cash transactions, and Hair orders, ensure each table with more than three columns is inside Mantine `Table.ScrollContainer` or a component-provided scroll wrapper. Use `minWidth` values that match column density: `640` for Customers, `760` for Cash, and `760` for Hair orders.

- [ ] **Step 2: Make filter rows wrap predictably**

For Cash, change the filter `Group` to:

```tsx
<Group align="flex-end" mb="md" gap="sm" wrap="wrap">
```

Set the search input to `flex="1 1 18rem"` and date/select controls to `w={{ base: "100%", xs: 180 }}` where Mantine supports responsive width props.

- [ ] **Step 3: Tighten dashboard controls**

In Dashboard, let the month picker group wrap on mobile without shrinking controls below readability:

```tsx
<Group gap="xs" wrap="nowrap" w={{ base: "100%", sm: "auto" }}>
```

Set `MonthPickerInput` to `flex={{ base: 1, sm: "unset" }}` and `miw={170}`.

- [ ] **Step 4: Align legal entity local tabs with the new shell**

In legal entity detail route, keep `Tabs` and existing helper functions. Set `Tabs.List` to allow horizontal overflow on narrow screens by wrapping it in a `Box` with `style={{ overflowX: "auto" }}`. The local tabs remain below `PageHeader`, not in the global header.

- [ ] **Step 5: Run web type checking**

Run: `vp run --filter web check-types`

Expected: PASS with no TypeScript errors.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/routes/_authenticated/dashboard.tsx apps/web/src/routes/_authenticated/customers/index.tsx apps/web/src/routes/_authenticated/cash.tsx apps/web/src/routes/_authenticated/hair-orders/index.tsx 'apps/web/src/routes/_authenticated/legal-entities/$legalEntityId/route.tsx'
git commit -m "feat: improve admin page responsiveness"
```

---

### Task 5: Verification and Polish

**Files:**
- Modify only files from Tasks 1-4 if verification finds issues.

**Interfaces:**
- Consumes: completed implementation tasks
- Produces: checked, responsive, working admin UI

- [ ] **Step 1: Run full checks**

Run:

```bash
vp check
vp test
```

Expected: both commands complete successfully.

- [ ] **Step 2: Start the web app**

Run:

```bash
vp run dev:web
```

Expected: Vite dev server starts and prints a local URL.

- [ ] **Step 3: Inspect desktop and mobile**

Open the local URL and inspect:

- Desktop width around `1440px`: primary tabs visible, no left sidebar, active tab clear, ledger rule visible.
- Tablet width around `768px`: navigation collapses before tab labels overlap.
- Mobile width around `390px`: burger opens drawer, drawer links close it, page actions wrap cleanly.
- Dashboard month controls remain usable.
- Customers search and pagination remain usable.
- Cash filters wrap without horizontal page overflow.
- Legal entity local tabs still navigate and show the unassigned document badge where applicable.

- [ ] **Step 4: Fix verification findings**

For each issue, patch the smallest affected file from Tasks 1-4 and rerun the narrowest relevant command:

```bash
vp run --filter web check-types
```

Then rerun `vp check` and `vp test` before completion.

- [ ] **Step 5: Commit final polish**

If Step 4 changed files, commit them:

```bash
git add apps/web/src packages/ui/src
git commit -m "fix: polish atelier ledger admin UI"
```

If Step 4 changed no files, skip this commit.
