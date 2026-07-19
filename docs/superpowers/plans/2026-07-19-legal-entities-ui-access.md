# Legal Entities UI Access Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve access to the legal entities route by adding a clear entity hub, local entity tabs, entity switching, and visible document work indicators.

**Architecture:** Add a small legal-entity navigation helper for shared tab/action metadata and switch-target path logic. Use that helper from the legal entities hub and detail layout. Keep server APIs unchanged and use existing TRPC queries for entity data and unassigned document counts.

**Tech Stack:** React, TypeScript, Mantine, Tabler icons, TanStack Router, TanStack Query, TRPC, Vite+, Vitest.

## Global Constraints

- The current branch must not be `main` when committing.
- Use the existing Mantine and TanStack Router patterns.
- Expected legal entity count is small, usually one to five entities.
- Do not add legal entity creation unless an existing flow already supports it.
- Do not add heavy search, filtering, or sorting for large legal entity sets.
- Do not redesign unrelated workspace navigation.
- Do not change backend document scoping unless existing APIs already support it.
- Preserve current global unassigned document behavior and label it clearly as `Unassigned documents` where appropriate.
- Run `vp check`.
- Run `vp test`; if it fails because required env vars are missing for `packages/env/src/server.test.ts`, record that as the known baseline environment issue.

---

## File Structure

- Create `apps/web/src/lib/legal-entity-navigation.ts`
  - Owns legal-entity section metadata and URL helpers.
  - Exports `LEGAL_ENTITY_SECTIONS`, `LegalEntitySectionValue`, `getLegalEntitySectionFromPath`, and `getLegalEntitySectionPath`.

- Create `apps/web/src/lib/legal-entity-navigation.test.ts`
  - Verifies path-to-section detection and section-to-path generation.

- Modify `apps/web/src/routes/_authenticated/legal-entities/index.tsx`
  - Replaces the plain table with a compact hub.
  - Uses shared navigation metadata for direct actions.
  - Shows pending document count on the Documents action.

- Modify `apps/web/src/routes/_authenticated/legal-entities/$legalEntityId/route.tsx`
  - Adds a back link, local tabs, entity switcher, missing-entity state, and document tab badge.
  - Uses shared navigation helpers to preserve section on entity switch.

- Modify `apps/web/src/routes/_authenticated/route.tsx`
  - Removes the nested legal-entity subnav from the global sidebar after local tabs exist.
  - Keeps `Legal entities` as the global entry point with the existing unassigned document badge.

- Generated route files
  - `apps/web/src/routeTree.gen.ts` may change after running Vite+ checks or the router generator. Only include it if tooling updates it.

---

### Task 1: Add Legal Entity Navigation Helper

**Files:**
- Create: `apps/web/src/lib/legal-entity-navigation.ts`
- Create: `apps/web/src/lib/legal-entity-navigation.test.ts`

**Interfaces:**
- Produces:
  - `type LegalEntitySectionValue = "overview" | "documents" | "bank-accounts" | "salons"`
  - `const LEGAL_ENTITY_SECTIONS: readonly LegalEntitySection[]`
  - `function getLegalEntitySectionFromPath(pathname: string): LegalEntitySectionValue`
  - `function getLegalEntitySectionPath(legalEntityId: string, section: LegalEntitySectionValue): string`

- [ ] **Step 1: Write the failing tests**

Create `apps/web/src/lib/legal-entity-navigation.test.ts`:

```ts
import { describe, expect, it } from "vitest"

import { getLegalEntitySectionFromPath, getLegalEntitySectionPath } from "./legal-entity-navigation"

describe("legal entity navigation", () => {
  it("detects the active legal entity section from a pathname", () => {
    expect(getLegalEntitySectionFromPath("/legal-entities/entity-1")).toBe("overview")
    expect(getLegalEntitySectionFromPath("/legal-entities/entity-1/overview")).toBe("overview")
    expect(getLegalEntitySectionFromPath("/legal-entities/entity-1/documents")).toBe("documents")
    expect(getLegalEntitySectionFromPath("/legal-entities/entity-1/bank-accounts")).toBe("bank-accounts")
    expect(getLegalEntitySectionFromPath("/legal-entities/entity-1/bank-accounts/account-1")).toBe("bank-accounts")
    expect(getLegalEntitySectionFromPath("/legal-entities/entity-1/salons")).toBe("salons")
    expect(getLegalEntitySectionFromPath("/dashboard")).toBe("overview")
  })

  it("builds legal entity section paths", () => {
    expect(getLegalEntitySectionPath("entity-1", "overview")).toBe("/legal-entities/entity-1/overview")
    expect(getLegalEntitySectionPath("entity-1", "documents")).toBe("/legal-entities/entity-1/documents")
    expect(getLegalEntitySectionPath("entity-1", "bank-accounts")).toBe("/legal-entities/entity-1/bank-accounts")
    expect(getLegalEntitySectionPath("entity-1", "salons")).toBe("/legal-entities/entity-1/salons")
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
vp test apps/web/src/lib/legal-entity-navigation.test.ts
```

Expected: FAIL because `apps/web/src/lib/legal-entity-navigation.ts` does not exist.

- [ ] **Step 3: Add the helper implementation**

Create `apps/web/src/lib/legal-entity-navigation.ts`:

```ts
export type LegalEntitySectionValue = "overview" | "documents" | "bank-accounts" | "salons"

export type LegalEntitySection = {
  value: LegalEntitySectionValue
  label: string
}

export const LEGAL_ENTITY_SECTIONS = [
  { value: "overview", label: "Overview" },
  { value: "documents", label: "Documents" },
  { value: "bank-accounts", label: "Bank accounts" },
  { value: "salons", label: "Salons" },
] as const satisfies readonly LegalEntitySection[]

const SECTION_VALUES = new Set<LegalEntitySectionValue>(LEGAL_ENTITY_SECTIONS.map((section) => section.value))

export function getLegalEntitySectionFromPath(pathname: string): LegalEntitySectionValue {
  const match = pathname.match(/^\/legal-entities\/[^/]+(?:\/([^/]+))?/)
  const section = match?.[1] as LegalEntitySectionValue | undefined

  return section && SECTION_VALUES.has(section) ? section : "overview"
}

export function getLegalEntitySectionPath(
  legalEntityId: string,
  section: LegalEntitySectionValue,
): `/legal-entities/${string}/${LegalEntitySectionValue}` {
  return `/legal-entities/${legalEntityId}/${section}`
}
```

- [ ] **Step 4: Run the helper test to verify it passes**

Run:

```bash
vp test apps/web/src/lib/legal-entity-navigation.test.ts
```

Expected: PASS for `apps/web/src/lib/legal-entity-navigation.test.ts`.

- [ ] **Step 5: Commit**

Run:

```bash
git add apps/web/src/lib/legal-entity-navigation.ts apps/web/src/lib/legal-entity-navigation.test.ts
git commit -m "feat: add legal entity navigation helpers"
```

---

### Task 2: Build The Legal Entities Hub

**Files:**
- Modify: `apps/web/src/routes/_authenticated/legal-entities/index.tsx`

**Interfaces:**
- Consumes:
  - `LEGAL_ENTITY_SECTIONS`
  - `getLegalEntitySectionPath(legalEntityId, section)`

- [ ] **Step 1: Replace the plain table with a compact hub**

Modify `apps/web/src/routes/_authenticated/legal-entities/index.tsx` to this structure:

```tsx
import { Badge, Button, Card, Container, Group, SimpleGrid, Stack, Text, Title } from "@mantine/core"
import { useQuery } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"

import { PageHeader } from "@/components/page-header"
import { COUNTRY_FLAGS, COUNTRY_LABELS, type Country } from "@/lib/legal-entity"
import { LEGAL_ENTITY_SECTIONS, getLegalEntitySectionPath } from "@/lib/legal-entity-navigation"
import { trpc } from "@/utils/trpc"

export const Route = createFileRoute("/_authenticated/legal-entities/")({
  component: LegalEntitiesIndex,
})

function LegalEntitiesIndex() {
  const { data: legalEntities = [] } = useQuery(trpc.legalEntities.list.queryOptions({}))
  const { data: unassignedAttachments = [] } = useQuery(
    trpc.bankStatementAttachments.list.queryOptions({ assigned: false }),
  )
  const unassignedCount = unassignedAttachments.length

  return (
    <Container size="xl">
      <PageHeader title="Legal entities" description="Companies and sole-trader registrations." />
      {legalEntities.length === 0 ? (
        <Card withBorder padding="lg">
          <Stack gap={4}>
            <Title order={4} fw={600}>
              No legal entities
            </Title>
            <Text size="sm" c="dimmed">
              Legal entities will appear here once they have been added.
            </Text>
          </Stack>
        </Card>
      ) : (
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
          {legalEntities.map((legalEntity) => {
            const country = legalEntity.country as Country

            return (
              <Card key={legalEntity.id} withBorder padding="lg">
                <Stack gap="md">
                  <Stack gap={4}>
                    <Title
                      order={3}
                      fw={600}
                      renderRoot={(props) => (
                        <Link
                          to="/legal-entities/$legalEntityId/overview"
                          params={{ legalEntityId: legalEntity.id }}
                          {...props}
                        />
                      )}
                    >
                      {legalEntity.name}
                    </Title>
                    <Text size="sm" c="dimmed">
                      {legalEntity.type} · {COUNTRY_FLAGS[country]} {COUNTRY_LABELS[country]} ·{" "}
                      {legalEntity.defaultCurrency}
                    </Text>
                  </Stack>

                  <Group gap="xs">
                    {LEGAL_ENTITY_SECTIONS.map((section) => {
                      const showBadge = section.value === "documents" && unassignedCount > 0

                      return (
                        <Button
                          key={section.value}
                          size="xs"
                          variant={section.value === "overview" ? "filled" : "default"}
                          renderRoot={(props) => (
                            <Link
                              to={getLegalEntitySectionPath(legalEntity.id, section.value)}
                              params={{ legalEntityId: legalEntity.id }}
                              {...props}
                            />
                          )}
                          rightSection={
                            showBadge ? (
                              <Badge size="xs" variant="filled" color="orange" circle>
                                {unassignedCount}
                              </Badge>
                            ) : null
                          }
                        >
                          {section.label}
                        </Button>
                      )
                    })}
                  </Group>
                </Stack>
              </Card>
            )
          })}
        </SimpleGrid>
      )}
    </Container>
  )
}
```

- [ ] **Step 2: Run focused checks**

Run:

```bash
vp check
```

Expected: PASS with no format or lint errors.

Run:

```bash
vp run --filter web check-types
```

Expected: PASS with no TypeScript errors. If TanStack Router rejects `to={getLegalEntitySectionPath(...)}`, replace those generated path links with explicit conditional `Link` targets:

```tsx
const linkProps =
  section.value === "overview"
    ? { to: "/legal-entities/$legalEntityId/overview" as const, params: { legalEntityId: legalEntity.id } }
    : section.value === "documents"
      ? { to: "/legal-entities/$legalEntityId/documents" as const, params: { legalEntityId: legalEntity.id } }
      : section.value === "bank-accounts"
        ? { to: "/legal-entities/$legalEntityId/bank-accounts" as const, params: { legalEntityId: legalEntity.id } }
        : { to: "/legal-entities/$legalEntityId/salons" as const, params: { legalEntityId: legalEntity.id } }
```

- [ ] **Step 3: Commit**

Run:

```bash
git add apps/web/src/routes/_authenticated/legal-entities/index.tsx
git commit -m "feat: add legal entities hub"
```

---

### Task 3: Add Local Detail Navigation And Entity Switching

**Files:**
- Modify: `apps/web/src/routes/_authenticated/legal-entities/$legalEntityId/route.tsx`

**Interfaces:**
- Consumes:
  - `LEGAL_ENTITY_SECTIONS`
  - `LegalEntitySectionValue`
  - `getLegalEntitySectionFromPath(pathname)`
  - `getLegalEntitySectionPath(legalEntityId, section)`

- [ ] **Step 1: Update imports**

In `apps/web/src/routes/_authenticated/legal-entities/$legalEntityId/route.tsx`, update imports to include the navigation controls and icons:

```tsx
import { Anchor, Badge, Button, Container, Group, Modal, Select, Stack, Tabs, Text, TextInput } from "@mantine/core"
import { IconArrowLeft, IconPencil } from "@tabler/icons-react"
import { Link, Outlet, createFileRoute, useLocation } from "@tanstack/react-router"
```

Add the helper import:

```tsx
import {
  LEGAL_ENTITY_SECTIONS,
  type LegalEntitySectionValue,
  getLegalEntitySectionFromPath,
  getLegalEntitySectionPath,
} from "@/lib/legal-entity-navigation"
```

- [ ] **Step 2: Add detail navigation behavior**

Inside `LegalEntityLayout`, add these values after `const { legalEntityId } = Route.useParams()`:

```tsx
const navigate = Route.useNavigate()
const location = useLocation()
const activeSection = getLegalEntitySectionFromPath(location.pathname)
```

Add these queries near the existing current-entity query:

```tsx
const { data: legalEntities = [] } = useQuery(trpc.legalEntities.list.queryOptions({}))
const { data: unassignedAttachments = [] } = useQuery(
  trpc.bankStatementAttachments.list.queryOptions({ assigned: false }),
)
const unassignedCount = unassignedAttachments.length
```

Add these handlers before the `return`:

```tsx
const handleSectionChange = (value: string | null) => {
  if (!value || value === activeSection) return
  navigate({
    to: getLegalEntitySectionPath(legalEntityId, value as LegalEntitySectionValue),
    params: { legalEntityId },
  })
}

const handleEntityChange = (nextLegalEntityId: string | null) => {
  if (!nextLegalEntityId || nextLegalEntityId === legalEntityId) return
  navigate({
    to: getLegalEntitySectionPath(nextLegalEntityId, activeSection),
    params: { legalEntityId: nextLegalEntityId },
  })
}
```

- [ ] **Step 3: Add a missing-entity state**

Before the main `return`, add:

```tsx
if (legalEntity === null) {
  return (
    <Container size="xl">
      <Stack gap="md">
        <Anchor component={Link} to="/legal-entities" size="xs" c="dimmed">
          <Group gap={4}>
            <IconArrowLeft size={12} />
            Back to legal entities
          </Group>
        </Anchor>
        <Text c="dimmed">Legal entity not found.</Text>
      </Stack>
    </Container>
  )
}
```

If the query returns `undefined` during loading and never returns `null` for missing records, keep the layout loading label as `Legal entity` and rely on existing error behavior.

- [ ] **Step 4: Render back link, switcher, edit button, and tabs**

Replace the existing top-level return header area with this structure:

```tsx
return (
  <Container size="xl">
    <Anchor component={Link} to="/legal-entities" size="xs" c="dimmed" mb="xs" display="inline-block">
      <Group gap={4}>
        <IconArrowLeft size={12} />
        Back to legal entities
      </Group>
    </Anchor>
    <PageHeader
      title={legalEntity?.name ?? "Legal entity"}
      description={description}
      actions={
        <>
          <Select
            aria-label="Switch legal entity"
            data={legalEntities.map((entity) => ({ value: entity.id, label: entity.name }))}
            value={legalEntityId}
            onChange={handleEntityChange}
            disabled={legalEntities.length <= 1}
            searchable={legalEntities.length > 5}
            size="sm"
            w={220}
          />
          <Button variant="default" leftSection={<IconPencil size={14} />} onClick={openEdit} disabled={!legalEntity}>
            Edit
          </Button>
        </>
      }
    />
    <Stack>
      <Tabs value={activeSection} onChange={handleSectionChange}>
        <Tabs.List>
          {LEGAL_ENTITY_SECTIONS.map((section) => (
            <Tabs.Tab
              key={section.value}
              value={section.value}
              rightSection={
                section.value === "documents" && unassignedCount > 0 ? (
                  <Badge size="xs" variant="filled" color="orange" circle>
                    {unassignedCount}
                  </Badge>
                ) : null
              }
            >
              {section.label}
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs>

      <Outlet />
    </Stack>

    <EditLegalEntityModal
      opened={editOpened}
      onClose={closeEdit}
      legalEntityId={legalEntityId}
      initial={
        legalEntity
          ? {
              name: legalEntity.name,
              registrationNumber: legalEntity.registrationNumber ?? "",
              vatNumber: legalEntity.vatNumber ?? "",
            }
          : null
      }
    />
  </Container>
)
```

- [ ] **Step 5: Run focused checks**

Run:

```bash
vp check
```

Expected: PASS with no format or lint errors.

Run:

```bash
vp run --filter web check-types
```

Expected: PASS with no TypeScript errors. If TanStack Router rejects helper-built `to` paths in `navigate`, replace the two `navigate` calls with explicit conditionals for each section using the same path strings shown in Task 2.

- [ ] **Step 6: Commit**

Run:

```bash
git add 'apps/web/src/routes/_authenticated/legal-entities/$legalEntityId/route.tsx'
git commit -m "feat: add legal entity detail navigation"
```

---

### Task 4: Simplify Global Sidebar Legal Entity Navigation

**Files:**
- Modify: `apps/web/src/routes/_authenticated/route.tsx`
- Modify: `apps/web/src/routes/_authenticated/route.module.css`

**Interfaces:**
- Consumes: local tabs introduced in Task 3.
- Produces: global sidebar with only the `Legal entities` entry for this area.

- [ ] **Step 1: Remove nested legal entity tab metadata and query**

In `apps/web/src/routes/_authenticated/route.tsx`, remove these icon imports if no longer used:

```tsx
IconFileText,
IconWallet,
```

Remove the `LEGAL_ENTITY_TABS` constant.

Inside `SidebarNav`, remove:

```tsx
const entityMatch = location.pathname.match(/^\/legal-entities\/([^/]+)(?:\/([^/]+))?/)
const entityId = entityMatch?.[1]
const entityTab = entityMatch?.[2] ?? "overview"

const { data: entity } = useQuery({
  ...trpc.legalEntities.get.queryOptions({ id: entityId ?? "" }),
  enabled: !!entityId,
})
```

Keep `const location = useLocation()` because `TopLink` still uses active route behavior separately.

- [ ] **Step 2: Remove nested sidebar rendering**

Delete the conditional block that starts with:

```tsx
{entityId && (
  <Box mt={6} className={classes.entitySubNav}>
```

and ends after the nested `LEGAL_ENTITY_TABS.map(...)` stack.

- [ ] **Step 3: Remove unused CSS**

In `apps/web/src/routes/_authenticated/route.module.css`, remove:

```css
.entitySubNav {
  margin-left: 16px;
  padding-left: 10px;
  border-left: 1px solid var(--prive-border);
}

.subNavLink {
  border-radius: var(--mantine-radius-lg);
  padding: 6px 10px;
  font-size: var(--mantine-font-size-sm);
}
```

- [ ] **Step 4: Run focused checks**

Run:

```bash
vp check
```

Expected: PASS with no format or lint errors.

Run:

```bash
vp run --filter web check-types
```

Expected: PASS with no TypeScript errors.

- [ ] **Step 5: Commit**

Run:

```bash
git add apps/web/src/routes/_authenticated/route.tsx apps/web/src/routes/_authenticated/route.module.css
git commit -m "refactor: simplify legal entity sidebar navigation"
```

---

### Task 5: Final Validation And Responsive Inspection

**Files:**
- Inspect: `apps/web/src/routes/_authenticated/legal-entities/index.tsx`
- Inspect: `apps/web/src/routes/_authenticated/legal-entities/$legalEntityId/route.tsx`
- Inspect: `apps/web/src/routes/_authenticated/route.tsx`
- Inspect: `apps/web/src/routeTree.gen.ts`

**Interfaces:**
- Consumes: all prior tasks.
- Produces: validated implementation branch ready for review.

- [ ] **Step 1: Check route tree status**

Run:

```bash
git status --short
```

Expected: either clean or only intentional files changed. If `apps/web/src/routeTree.gen.ts` changed because tooling regenerated it, inspect it:

```bash
git diff -- apps/web/src/routeTree.gen.ts
```

Expected: generated route tree changes only.

- [ ] **Step 2: Run full checks**

Run:

```bash
vp check
```

Expected: PASS with no format or lint errors.

Run:

```bash
vp test
```

Expected: PASS when required env vars are present. If it fails with the known missing env vars in `packages/env/src/server.test.ts`, record the exact missing variables and run the focused helper test:

```bash
vp test apps/web/src/lib/legal-entity-navigation.test.ts
```

Expected: PASS for the helper test.

- [ ] **Step 3: Run the web app for manual inspection**

Run:

```bash
vp run dev:web
```

Expected: the dev server prints a local URL.

Open the printed URL and inspect these paths at desktop and mobile widths:

```text
/legal-entities
/legal-entities/<existing-legal-entity-id>/overview
/legal-entities/<existing-legal-entity-id>/documents
/legal-entities/<existing-legal-entity-id>/bank-accounts
/legal-entities/<existing-legal-entity-id>/salons
```

Confirm:

- Hub entries show direct actions without relying on the sidebar.
- Detail pages show `Back to legal entities`.
- Detail pages show local tabs.
- The Documents action/tab shows the unassigned document count when present.
- The entity switcher changes entities and preserves the active section.
- Mobile access to subpages works without opening the sidebar.

- [ ] **Step 4: Commit generated changes if needed**

If `apps/web/src/routeTree.gen.ts` changed and the diff is generated-only, run:

```bash
git add apps/web/src/routeTree.gen.ts
git commit -m "chore: update route tree"
```

If no generated changes exist, skip this commit.

- [ ] **Step 5: Summarize final state**

Run:

```bash
git status --short
git log --oneline -5
```

Expected: clean status and recent commits for the helper, hub, detail navigation, and sidebar simplification.

Report:

- Current branch name.
- Commits created.
- Verification commands and results.
- Any known baseline environment failure that remains.
