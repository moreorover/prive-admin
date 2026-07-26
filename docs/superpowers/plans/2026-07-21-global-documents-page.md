# Global Documents Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a top-level `/documents` page where users can find every uploaded document, see whether it is assigned, and see the legal entity for assigned documents.

**Architecture:** Add a paginated global attachment listing in the repository layer that returns a uniform row shape for assigned and unassigned documents. Expose it through application services and TRPC, then build a new authenticated route that reuses the existing preview, upload, assign, unassign, and unassigned-delete workflows.

**Tech Stack:** TypeScript, React, Mantine, TanStack Router, TanStack Query, TRPC, Drizzle ORM, Vite+, Vitest.

## Global Constraints

- Work on branch `global-documents-page`.
- Add `/documents` as a top-level authenticated route and main navigation item labeled `Documents`.
- Default the global page to `Unassigned`.
- Unassigned documents remain global and must not imply a legal entity.
- Assigned rows must show legal entity context.
- Keep upload, preview, assign, unassign, and unassigned-delete workflows available from the global page.
- Do not delete assigned documents from this feature.
- Do not change the upload endpoint or storage behavior.
- Do not redesign bank statement matching.
- Do not remove or break the legal-entity documents tab.
- Run `vp check`.
- Run focused new tests.
- Run `vp test`.
- Browser-validate `/documents` for unassigned, assigned, and all modes, including preview, assign, unassign, and delete.

---

## File Structure

- Modify `packages/db/src/repositories/bank-statement-attachments.ts`
  - Add `GlobalBankStatementAttachmentStatus`, `GlobalBankStatementAttachmentRow`, and `listGlobalBankStatementAttachments`.
  - Join assigned attachments to entry, bank account, and legal entity.
  - Return `null` context for unassigned rows.

- Modify `packages/db/src/repositories/bank-statement-attachments.test.ts`
  - Add repository tests for global `assigned`, `unassigned`, and `all` status filters.

- Modify `packages/application/src/services/bank-statement-attachments.ts`
  - Add `listGlobalBankStatementAttachments` service wrapper.

- Modify `packages/application/src/services/bank-statement-attachments.test.ts`
  - Add service forwarding coverage for global status and paging input.

- Modify `packages/api/src/routers/bank-statement-attachments.ts`
  - Add `listGlobal` query with `status`, `page`, and `pageSize`.

- Modify `packages/api/src/routers/bank-statement-attachments.test.ts`
  - Add router coverage for status validation, offset calculation, and paged result shape.

- Create `apps/web/src/routes/_authenticated/documents.tsx`
  - Add global documents page, filters, table, pagination, mutations, and preview dialog.

- Modify `apps/web/src/lib/app-navigation.ts`
  - Add Documents nav item with an unassigned badge.

- Modify `apps/web/src/routes/_authenticated/route.tsx`
  - Keep the existing badge calculation and let the new nav item consume it.

- Accept generated changes to `apps/web/src/routeTree.gen.ts`
  - TanStack Router will update this file when `vp check` or the route generator runs.

---

### Task 1: Add Global Attachment Repository Query

**Files:**
- Modify: `packages/db/src/repositories/bank-statement-attachments.ts`
- Modify: `packages/db/src/repositories/bank-statement-attachments.test.ts`

**Interfaces:**
- Consumes existing schemas: `bankStatementAttachment`, `bankStatementEntry`, `bankAccount`, `legalEntity`.
- Produces:

```ts
export type GlobalBankStatementAttachmentStatus = "assigned" | "unassigned" | "all"

export type GlobalBankStatementAttachmentRow = {
  attachment: typeof bankStatementAttachment.$inferSelect
  assignmentState: "assigned" | "unassigned"
  entry: typeof bankStatementEntry.$inferSelect | null
  bankAccount: Pick<typeof bankAccount.$inferSelect, "id" | "displayName" | "bankName" | "currency"> | null
  legalEntity: Pick<typeof legalEntity.$inferSelect, "id" | "name"> | null
}

export async function listGlobalBankStatementAttachments(
  database: Db = db,
  input: { status: GlobalBankStatementAttachmentStatus; pageSize: number; offset: number },
): Promise<{ items: GlobalBankStatementAttachmentRow[]; totalCount: number }>
```

- [ ] **Step 1: Write failing repository tests**

Append tests to `packages/db/src/repositories/bank-statement-attachments.test.ts`. Update imports to include `isNull`, `legalEntity`, and `listGlobalBankStatementAttachments`.

```ts
import { and, desc, eq, isNotNull, isNull } from "drizzle-orm"
import { legalEntity } from "../schema/legal-entity"
import { listAssignedBankStatementAttachments, listGlobalBankStatementAttachments } from "./bank-statement-attachments"
```

Add this helper and tests inside the existing `describe` block:

```ts
function createSelectBuilders(itemsRows: unknown[], countRows: unknown[]) {
  const calls: {
    from: unknown[]
    leftJoin: Array<{ table: unknown; condition: unknown }>
    limit: number[]
    offset: number[]
    orderBy: unknown[][]
    where: unknown[]
  } = { from: [], leftJoin: [], limit: [], offset: [], orderBy: [], where: [] }

  const itemsBuilder = {
    from: vi.fn((table: unknown) => {
      calls.from.push(table)
      return itemsBuilder
    }),
    leftJoin: vi.fn((table: unknown, condition: unknown) => {
      calls.leftJoin.push({ table, condition })
      return itemsBuilder
    }),
    where: vi.fn((condition: unknown) => {
      calls.where.push(condition)
      return itemsBuilder
    }),
    orderBy: vi.fn((...values: unknown[]) => {
      calls.orderBy.push(values)
      return itemsBuilder
    }),
    limit: vi.fn((value: number) => {
      calls.limit.push(value)
      return itemsBuilder
    }),
    offset: vi.fn(async (value: number) => {
      calls.offset.push(value)
      return itemsRows
    }),
  }
  const countBuilder = {
    from: vi.fn((table: unknown) => {
      calls.from.push(table)
      return countBuilder
    }),
    leftJoin: vi.fn((table: unknown, condition: unknown) => {
      calls.leftJoin.push({ table, condition })
      return countBuilder
    }),
    then: vi.fn((resolve: (value: unknown[]) => unknown) => Promise.resolve(resolve(countRows))),
    where: vi.fn(async (condition: unknown) => {
      calls.where.push(condition)
      return countRows
    }),
  }
  const database = {
    select: vi.fn().mockReturnValueOnce(itemsBuilder).mockReturnValueOnce(countBuilder),
  }
  return { calls, database }
}

it("lists global assigned documents with legal entity context", async () => {
  const rows = [
    {
      attachment: { id: "attachment-1", bankStatementEntryId: "entry-1" },
      assignmentState: "assigned",
      entry: { id: "entry-1" },
      bankAccount: { id: "bank-account-1", displayName: "Main", bankName: "Bank", currency: "EUR" },
      legalEntity: { id: "legal-entity-1", name: "Prive LT" },
    },
  ]
  const { calls, database } = createSelectBuilders(rows, [{ totalCount: 3 }])

  const result = await listGlobalBankStatementAttachments(database as never, {
    status: "assigned",
    pageSize: 25,
    offset: 50,
  })

  const expectedWhere = isNotNull(bankStatementAttachment.bankStatementEntryId)
  expect(result).toEqual({ items: rows, totalCount: 3 })
  expect(database.select).toHaveBeenCalledTimes(2)
  expect(calls.from).toEqual([bankStatementAttachment, bankStatementAttachment])
  expect(calls.leftJoin.map((call) => call.table)).toEqual([
    bankStatementEntry,
    bankAccount,
    legalEntity,
    bankStatementEntry,
    bankAccount,
    legalEntity,
  ])
  expect(calls.where).toEqual([expectedWhere, expectedWhere])
  expect(calls.orderBy).toEqual([
    [desc(bankStatementAttachment.uploadedAt), desc(bankStatementAttachment.id)],
  ])
  expect(calls.limit).toEqual([25])
  expect(calls.offset).toEqual([50])
})

it("lists global unassigned documents with null assignment context", async () => {
  const rows = [
    {
      attachment: { id: "attachment-1", bankStatementEntryId: null },
      assignmentState: "unassigned",
      entry: null,
      bankAccount: null,
      legalEntity: null,
    },
  ]
  const { calls, database } = createSelectBuilders(rows, [{ totalCount: 1 }])

  await listGlobalBankStatementAttachments(database as never, {
    status: "unassigned",
    pageSize: 10,
    offset: 0,
  })

  const expectedWhere = isNull(bankStatementAttachment.bankStatementEntryId)
  expect(calls.where).toEqual([expectedWhere, expectedWhere])
  expect(calls.limit).toEqual([10])
  expect(calls.offset).toEqual([0])
})

it("lists all global documents without assignment filter", async () => {
  const { calls, database } = createSelectBuilders([], [{ totalCount: 0 }])

  await listGlobalBankStatementAttachments(database as never, {
    status: "all",
    pageSize: 25,
    offset: 0,
  })

  expect(calls.where).toEqual([])
})
```

- [ ] **Step 2: Run repository tests and verify failure**

Run:

```bash
vp test packages/db/src/repositories/bank-statement-attachments.test.ts
```

Expected: FAIL because `listGlobalBankStatementAttachments` is not exported.

- [ ] **Step 3: Implement the repository query**

Modify `packages/db/src/repositories/bank-statement-attachments.ts` imports:

```ts
import { and, count, desc, eq, gte, isNotNull, isNull, lte, sql } from "drizzle-orm"
import { legalEntity } from "../schema/legal-entity"
```

Add after `listAssignedBankStatementAttachments`:

```ts
export type GlobalBankStatementAttachmentStatus = "assigned" | "unassigned" | "all"

export type GlobalBankStatementAttachmentRow = {
  attachment: typeof bankStatementAttachment.$inferSelect
  assignmentState: "assigned" | "unassigned"
  entry: typeof bankStatementEntry.$inferSelect | null
  bankAccount: Pick<typeof bankAccount.$inferSelect, "id" | "displayName" | "bankName" | "currency"> | null
  legalEntity: Pick<typeof legalEntity.$inferSelect, "id" | "name"> | null
}

export async function listGlobalBankStatementAttachments(
  database: Db = db,
  input: { status: GlobalBankStatementAttachmentStatus; pageSize: number; offset: number },
) {
  const where =
    input.status === "assigned"
      ? isNotNull(bankStatementAttachment.bankStatementEntryId)
      : input.status === "unassigned"
        ? isNull(bankStatementAttachment.bankStatementEntryId)
        : undefined

  const baseSelect = {
    attachment: bankStatementAttachment,
    assignmentState: sql<"assigned" | "unassigned">`
      case
        when ${bankStatementAttachment.bankStatementEntryId} is null then 'unassigned'
        else 'assigned'
      end
    `,
    entry: bankStatementEntry,
    bankAccount: {
      id: bankAccount.id,
      displayName: bankAccount.displayName,
      bankName: bankAccount.bankName,
      currency: bankAccount.currency,
    },
    legalEntity: {
      id: legalEntity.id,
      name: legalEntity.name,
    },
  }

  const itemsQuery = database
    .select(baseSelect)
    .from(bankStatementAttachment)
    .leftJoin(bankStatementEntry, eq(bankStatementAttachment.bankStatementEntryId, bankStatementEntry.id))
    .leftJoin(bankAccount, eq(bankStatementEntry.bankAccountId, bankAccount.id))
    .leftJoin(legalEntity, eq(bankAccount.legalEntityId, legalEntity.id))

  const items = await (where ? itemsQuery.where(where) : itemsQuery)
    .orderBy(desc(bankStatementAttachment.uploadedAt), desc(bankStatementAttachment.id))
    .limit(input.pageSize)
    .offset(input.offset)

  const countQuery = database
    .select({ totalCount: count() })
    .from(bankStatementAttachment)
    .leftJoin(bankStatementEntry, eq(bankStatementAttachment.bankStatementEntryId, bankStatementEntry.id))
    .leftJoin(bankAccount, eq(bankStatementEntry.bankAccountId, bankAccount.id))
    .leftJoin(legalEntity, eq(bankAccount.legalEntityId, legalEntity.id))

  const [countRow] = await (where ? countQuery.where(where) : countQuery)

  return { items, totalCount: countRow?.totalCount ?? 0 }
}
```

- [ ] **Step 4: Run repository tests and commit**

Run:

```bash
vp test packages/db/src/repositories/bank-statement-attachments.test.ts
```

Expected: PASS.

Commit:

```bash
git add packages/db/src/repositories/bank-statement-attachments.ts packages/db/src/repositories/bank-statement-attachments.test.ts
git commit -m "feat: add global document repository query"
```

---

### Task 2: Expose Global Document Listing Through Services And TRPC

**Files:**
- Modify: `packages/application/src/services/bank-statement-attachments.ts`
- Modify: `packages/application/src/services/bank-statement-attachments.test.ts`
- Modify: `packages/api/src/routers/bank-statement-attachments.ts`
- Modify: `packages/api/src/routers/bank-statement-attachments.test.ts`

**Interfaces:**
- Consumes: `listGlobalBankStatementAttachments(database, { status, pageSize, offset })`.
- Produces: `bankStatementAttachments.listGlobal({ status, page, pageSize })`.

- [ ] **Step 1: Write failing service test**

Update `packages/application/src/services/bank-statement-attachments.test.ts`:

```ts
import { listAssignedBankStatementAttachments, listGlobalBankStatementAttachments } from "./bank-statement-attachments"

const dbMock = vi.hoisted(() => ({
  listAssignedBankStatementAttachments: vi.fn(),
  listGlobalBankStatementAttachments: vi.fn(),
}))
```

Add inside the `describe` block:

```ts
it("forwards global document status and paging to the database layer", async () => {
  dbMock.listGlobalBankStatementAttachments.mockResolvedValue({ items: [], totalCount: 0 })

  await listGlobalBankStatementAttachments({
    status: "all",
    pageSize: 50,
    offset: 100,
  })

  expect(dbMock.listGlobalBankStatementAttachments).toHaveBeenCalledWith(undefined, {
    status: "all",
    pageSize: 50,
    offset: 100,
  })
})
```

- [ ] **Step 2: Write failing router test**

Update `packages/api/src/routers/bank-statement-attachments.test.ts` mock:

```ts
const servicesMock = vi.hoisted(() => ({
  assignBankStatementAttachment: vi.fn(),
  countBankStatementAttachments: vi.fn(),
  deleteBankStatementAttachmentFile: vi.fn(),
  listAssignedBankStatementAttachments: vi.fn(),
  listBankStatementAttachments: vi.fn(),
  listGlobalBankStatementAttachments: vi.fn(),
  unassignBankStatementAttachment: vi.fn(),
}))
```

Add inside the `describe` block:

```ts
it("lists global documents in the standard page envelope", async () => {
  const caller = bankStatementAttachmentsRouter.createCaller(ctx)
  const rows = [
    {
      attachment: { id: "attachment-1" },
      assignmentState: "assigned",
      entry: { id: "entry-1" },
      bankAccount: { id: "bank-account-1" },
      legalEntity: { id: "legal-entity-1", name: "Prive LT" },
    },
  ]
  servicesMock.listGlobalBankStatementAttachments.mockResolvedValue({ items: rows, totalCount: 12 })

  const result = await caller.listGlobal({
    status: "assigned",
    page: 2,
    pageSize: 10,
  })

  expect(result).toEqual({ items: rows, page: 2, pageSize: 10, totalCount: 12 })
  expect(servicesMock.listGlobalBankStatementAttachments).toHaveBeenCalledWith({
    status: "assigned",
    pageSize: 10,
    offset: 10,
  })
})
```

- [ ] **Step 3: Run service and router tests and verify failure**

Run:

```bash
vp test packages/application/src/services/bank-statement-attachments.test.ts packages/api/src/routers/bank-statement-attachments.test.ts
```

Expected: FAIL because the service and router APIs do not exist yet.

- [ ] **Step 4: Implement service wrapper**

Modify imports in `packages/application/src/services/bank-statement-attachments.ts`:

```ts
import {
  createBankStatementAttachment as insertBankStatementAttachment,
  assignBankStatementAttachment as patchAssignBankStatementAttachment,
  countBankStatementAttachments as fetchBankStatementAttachmentCounts,
  getBankStatementAttachment as findBankStatementAttachment,
  getBankStatementEntry as findBankStatementEntry,
  listAssignedBankStatementAttachments as fetchAssignedBankStatementAttachments,
  listGlobalBankStatementAttachments as fetchGlobalBankStatementAttachments,
  deleteBankStatementAttachment as removeBankStatementAttachment,
  listBankStatementAttachmentExportRows as fetchBankStatementAttachmentExportRows,
  listBankStatementAttachments as fetchBankStatementAttachments,
  unassignBankStatementAttachment as patchUnassignBankStatementAttachment,
} from "@prive-admin-tanstack/db"
```

Add after `listAssignedBankStatementAttachments`:

```ts
export async function listGlobalBankStatementAttachments(input: {
  status: "assigned" | "unassigned" | "all"
  pageSize: number
  offset: number
}) {
  return fetchGlobalBankStatementAttachments(undefined, input)
}
```

- [ ] **Step 5: Implement TRPC query**

Modify imports in `packages/api/src/routers/bank-statement-attachments.ts`:

```ts
import {
  assignBankStatementAttachment,
  countBankStatementAttachments,
  deleteBankStatementAttachmentFile,
  listAssignedBankStatementAttachments,
  listBankStatementAttachments,
  listGlobalBankStatementAttachments,
  unassignBankStatementAttachment,
} from "@prive-admin-tanstack/application/services"
```

Add this query after `listAssigned`:

```ts
  listGlobal: protectedProcedure
    .input(
      pageSchema.extend({
        status: z.enum(["assigned", "unassigned", "all"]).default("unassigned"),
      }),
    )
    .query(async ({ input }) => {
      try {
        const result = await listGlobalBankStatementAttachments({
          status: input.status,
          pageSize: input.pageSize,
          offset: getOffset(input),
        })
        return pagedResult(result.items, input, result.totalCount)
      } catch (error) {
        throw toTrpcError(error)
      }
    }),
```

- [ ] **Step 6: Run tests and commit**

Run:

```bash
vp test packages/application/src/services/bank-statement-attachments.test.ts packages/api/src/routers/bank-statement-attachments.test.ts
```

Expected: PASS.

Commit:

```bash
git add packages/application/src/services/bank-statement-attachments.ts packages/application/src/services/bank-statement-attachments.test.ts packages/api/src/routers/bank-statement-attachments.ts packages/api/src/routers/bank-statement-attachments.test.ts
git commit -m "feat: expose global documents query"
```

---

### Task 3: Add Documents Navigation

**Files:**
- Modify: `apps/web/src/lib/app-navigation.ts`
- Modify: `apps/web/src/routes/_authenticated/route.tsx`

**Interfaces:**
- Consumes existing `badgeKey: "unassigned"` support.
- Produces a top-level nav item `{ to: "/documents", label: "Documents", icon: IconFileDescription, badgeKey: "unassigned" }`.

- [ ] **Step 1: Write failing navigation test**

Modify `apps/web/src/lib/app-navigation.test.ts` and add:

```ts
it("includes top-level documents navigation with the unassigned badge", () => {
  expect(flatAppNavItems).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        to: "/documents",
        label: "Documents",
        badgeKey: "unassigned",
      }),
    ]),
  )
})
```

- [ ] **Step 2: Run navigation test and verify failure**

Run:

```bash
vp test apps/web/src/lib/app-navigation.test.ts
```

Expected: FAIL because `/documents` is not in navigation.

- [ ] **Step 3: Add navigation item**

Modify `apps/web/src/lib/app-navigation.ts`:

```ts
import {
  IconBuildingBank,
  IconCalendar,
  IconCash,
  IconFileDescription,
  IconLayoutDashboard,
  IconReceipt,
  IconScissors,
  IconSettings,
  IconUsers,
} from "@tabler/icons-react"
```

Add Documents to the `Workspace` group after Dashboard:

```ts
      { to: "/dashboard", label: "Dashboard", icon: IconLayoutDashboard },
      { to: "/documents", label: "Documents", icon: IconFileDescription, badgeKey: "unassigned" },
      { to: "/customers", label: "Customers", icon: IconUsers },
```

Remove `badgeKey: "unassigned"` from the Legal entities item so the document queue badge belongs to Documents:

```ts
      {
        to: "/legal-entities",
        label: "Legal entities",
        shortLabel: "Entities",
        icon: IconBuildingBank,
      },
```

- [ ] **Step 4: Run navigation test and commit**

Run:

```bash
vp test apps/web/src/lib/app-navigation.test.ts
```

Expected: PASS.

Commit:

```bash
git add apps/web/src/lib/app-navigation.ts apps/web/src/lib/app-navigation.test.ts
git commit -m "feat: add documents navigation"
```

---

### Task 4: Build Global Documents Route

**Files:**
- Create: `apps/web/src/routes/_authenticated/documents.tsx`
- Accept generated: `apps/web/src/routeTree.gen.ts`

**Interfaces:**
- Consumes `trpc.bankStatementAttachments.listGlobal`.
- Consumes mutations: `assign`, `unassign`, `delete`.
- Consumes upload endpoint: `/api/statement-attachments/upload`.
- Produces route: `/_authenticated/documents`.

- [ ] **Step 1: Create the route with the global table**

Create `apps/web/src/routes/_authenticated/documents.tsx`:

```tsx
import {
  ActionIcon,
  Box,
  Container,
  FileInput,
  Group,
  LoadingOverlay,
  Pagination,
  SegmentedControl,
  Select,
  Stack,
  Table,
  Text,
  Tooltip,
  UnstyledButton,
} from "@mantine/core"
import { notifications } from "@mantine/notifications"
import { IconLinkOff, IconTrash } from "@tabler/icons-react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useState } from "react"

import { AttachmentPreviewDialog, type AttachmentPreview } from "@/components/attachment-preview-dialog"
import { BreadcrumbItem } from "@/components/breadcrumbs"
import { PageHeader } from "@/components/page-header"
import { Section } from "@/components/section"
import { type Currency, formatMinor } from "@/lib/currency"
import { trpc } from "@/utils/trpc"

export const Route = createFileRoute("/_authenticated/documents")({
  component: DocumentsPage,
})

const PAGE_SIZE = 25
const ASSIGNABLE_ENTRIES_PAGE_SIZE = 100
type DocumentStatus = "unassigned" | "assigned" | "all"

function DocumentsPage() {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<DocumentStatus>("unassigned")
  const [page, setPage] = useState(1)
  const [assignableEntriesPage, setAssignableEntriesPage] = useState(1)
  const [busy, setBusy] = useState(false)
  const [fileInputKey, setFileInputKey] = useState(0)
  const [previewAttachment, setPreviewAttachment] = useState<AttachmentPreview | null>(null)

  const documentsQuery = useQuery(
    trpc.bankStatementAttachments.listGlobal.queryOptions(
      { status, page, pageSize: PAGE_SIZE },
      { placeholderData: (previousData) => previousData },
    ),
  )
  const documents = documentsQuery.data?.items ?? []
  const totalCount = documentsQuery.data?.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))

  useEffect(() => {
    setPage(1)
  }, [status])

  useEffect(() => {
    if (!documentsQuery.data) return
    setPage((currentPage) => Math.min(currentPage, totalPages))
  }, [documentsQuery.data, totalPages])

  const { data: assignableEntriesData } = useQuery(
    trpc.bankStatementEntries.list.queryOptions({
      status: "PENDING",
      page: assignableEntriesPage,
      pageSize: ASSIGNABLE_ENTRIES_PAGE_SIZE,
    }),
  )
  const assignableEntries = assignableEntriesData?.items ?? []
  const assignableEntriesTotalCount = assignableEntriesData?.totalCount ?? 0
  const assignableEntriesTotalPages = Math.max(1, Math.ceil(assignableEntriesTotalCount / ASSIGNABLE_ENTRIES_PAGE_SIZE))

  const entryOptions = assignableEntries.map((entry) => ({
    value: entry.id,
    label: `${entry.date} · ${entry.direction === "C" ? "+" : "-"}${formatMinor(
      entry.amount,
      entry.currency as Currency,
    )} · ${entry.counterpartyName ?? "-"}`,
  }))

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: trpc.bankStatementAttachments.listGlobal.queryKey() }),
      queryClient.invalidateQueries({ queryKey: trpc.bankStatementAttachments.list.queryKey() }),
      queryClient.invalidateQueries({ queryKey: trpc.bankStatementAttachments.listAssigned.queryKey() }),
      queryClient.invalidateQueries({ queryKey: trpc.bankStatementAttachments.counts.queryKey() }),
    ])
  }

  const upload = async (file: File) => {
    setBusy(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/statement-attachments/upload", { method: "POST", body: fd })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? `Upload failed (${res.status})`)
      }
      notifications.show({ color: "green", message: "Uploaded" })
      await invalidate()
    } catch (err) {
      notifications.show({ color: "red", message: (err as Error).message })
    } finally {
      setBusy(false)
      setFileInputKey((key) => key + 1)
    }
  }

  const assign = useMutation({
    ...trpc.bankStatementAttachments.assign.mutationOptions(),
    onSuccess: async () => {
      notifications.show({ color: "green", message: "Assigned" })
      await invalidate()
    },
    onError: (err) => notifications.show({ color: "red", message: err.message }),
  })

  const unassign = useMutation({
    ...trpc.bankStatementAttachments.unassign.mutationOptions(),
    onSuccess: async () => {
      notifications.show({ color: "green", message: "Unassigned" })
      await invalidate()
    },
    onError: (err) => notifications.show({ color: "red", message: err.message }),
  })

  const remove = useMutation({
    ...trpc.bankStatementAttachments.delete.mutationOptions(),
    onSuccess: async () => {
      notifications.show({ color: "green", message: "Deleted" })
      await invalidate()
    },
    onError: (err) => notifications.show({ color: "red", message: err.message }),
  })

  return (
    <Container size="xl">
      <BreadcrumbItem label="Documents" order={10} />
      <PageHeader
        title="Documents"
        description="Uploaded bank statement documents and their assignment status."
        actions={
          <FileInput
            key={fileInputKey}
            placeholder="Upload document"
            disabled={busy}
            value={null}
            onChange={(file) => {
              if (file) void upload(file)
            }}
            w={{ base: "100%", xs: 260 }}
            size="sm"
          />
        }
      />

      <Section padding={documents.length > 0 ? 0 : "lg"}>
        <Stack gap="md">
          <Group px={documents.length > 0 ? "md" : 0} pt={documents.length > 0 ? "md" : 0} justify="space-between">
            <SegmentedControl
              value={status}
              onChange={(value) => setStatus(value as DocumentStatus)}
              data={[
                { label: "Unassigned", value: "unassigned" },
                { label: "Assigned", value: "assigned" },
                { label: "All", value: "all" },
              ]}
              size="sm"
            />
            {assignableEntriesTotalPages > 1 ? (
              <Group gap="xs">
                <Text size="sm" c="dimmed">
                  {assignableEntriesTotalCount} pending entries
                </Text>
                <Pagination
                  size="sm"
                  total={assignableEntriesTotalPages}
                  value={Math.min(assignableEntriesPage, assignableEntriesTotalPages)}
                  onChange={setAssignableEntriesPage}
                />
              </Group>
            ) : null}
          </Group>

          <Box pos="relative">
            <LoadingOverlay visible={documentsQuery.isFetching} />
            {documentsQuery.isError ? (
              <Text size="sm" c="red" px={documents.length > 0 ? "md" : 0} pb="md">
                Unable to load documents.
              </Text>
            ) : documents.length > 0 ? (
              <Table.ScrollContainer minWidth={980}>
                <DocumentsTable
                  documents={documents}
                  entryOptions={entryOptions}
                  assignPending={assign.isPending}
                  unassignPending={unassign.isPending}
                  removePending={remove.isPending}
                  onAssign={(id, entryId) => assign.mutate({ id, entryId })}
                  onUnassign={(id) => unassign.mutate({ id })}
                  onRemove={(id) => remove.mutate({ id })}
                  onPreview={setPreviewAttachment}
                />
              </Table.ScrollContainer>
            ) : (
              <Text size="sm" c="dimmed">
                No {status === "all" ? "" : `${status} `}documents.
              </Text>
            )}
          </Box>

          {totalCount > PAGE_SIZE ? (
            <Group justify="space-between" px="md" pb="md">
              <Text size="sm" c="dimmed">
                {totalCount} document{totalCount === 1 ? "" : "s"} · Page {Math.min(page, totalPages)} of {totalPages}
              </Text>
              <Pagination size="sm" total={totalPages} value={Math.min(page, totalPages)} onChange={setPage} />
            </Group>
          ) : null}
        </Stack>
      </Section>

      <AttachmentPreviewDialog attachment={previewAttachment} onClose={() => setPreviewAttachment(null)} />
    </Container>
  )
}

function DocumentsTable({
  documents,
  entryOptions,
  assignPending,
  unassignPending,
  removePending,
  onAssign,
  onUnassign,
  onRemove,
  onPreview,
}: {
  documents: Array<{
    attachment: {
      id: string
      originalName: string
      contentType: string
      uploadedAt: string | Date
    }
    assignmentState: "assigned" | "unassigned"
    entry: {
      id: string
      date: string
      amount: number
      currency: string
      direction: string
      counterpartyName: string | null
      status: string
    } | null
    bankAccount: {
      id: string
      displayName: string
      bankName: string | null
      currency: string
    } | null
    legalEntity: {
      id: string
      name: string
    } | null
  }>
  entryOptions: Array<{ value: string; label: string }>
  assignPending: boolean
  unassignPending: boolean
  removePending: boolean
  onAssign: (id: string, entryId: string) => void
  onUnassign: (id: string) => void
  onRemove: (id: string) => void
  onPreview: (attachment: AttachmentPreview) => void
}) {
  return (
    <Table>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>File</Table.Th>
          <Table.Th>Assignment</Table.Th>
          <Table.Th>Legal entity</Table.Th>
          <Table.Th>Bank account</Table.Th>
          <Table.Th>Entry</Table.Th>
          <Table.Th>Counterparty</Table.Th>
          <Table.Th>Status</Table.Th>
          <Table.Th />
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {documents.map(({ attachment, assignmentState, entry, bankAccount, legalEntity }) => (
          <Table.Tr key={attachment.id}>
            <Table.Td>
              <Stack gap={2}>
                <UnstyledButton
                  onClick={() =>
                    onPreview({
                      id: attachment.id,
                      originalName: attachment.originalName,
                      contentType: attachment.contentType,
                    })
                  }
                  style={{ textAlign: "left" }}
                >
                  <Text size="sm" td="underline" style={{ wordBreak: "break-all" }}>
                    {attachment.originalName}
                  </Text>
                </UnstyledButton>
                <Text size="xs" c="dimmed">
                  Uploaded {new Date(attachment.uploadedAt).toLocaleString()}
                </Text>
              </Stack>
            </Table.Td>
            <Table.Td>
              {assignmentState === "unassigned" ? (
                <Select
                  placeholder="Pick entry..."
                  searchable
                  data={entryOptions}
                  value={null}
                  onChange={(entryId) => {
                    if (entryId) onAssign(attachment.id, entryId)
                  }}
                  disabled={assignPending}
                  w={260}
                />
              ) : (
                <Text size="sm">Assigned</Text>
              )}
            </Table.Td>
            <Table.Td>{legalEntity?.name ?? "-"}</Table.Td>
            <Table.Td>
              {bankAccount ? (
                <Stack gap={2}>
                  <Text size="sm">{bankAccount.displayName}</Text>
                  {bankAccount.bankName ? (
                    <Text size="xs" c="dimmed">
                      {bankAccount.bankName}
                    </Text>
                  ) : null}
                </Stack>
              ) : (
                "-"
              )}
            </Table.Td>
            <Table.Td>
              {entry ? (
                <Stack gap={2}>
                  <Text size="sm">{entry.date}</Text>
                  <Text size="xs" c="dimmed">
                    {entry.direction === "C" ? "+" : "-"}
                    {formatMinor(entry.amount, entry.currency as Currency)}
                  </Text>
                </Stack>
              ) : (
                "-"
              )}
            </Table.Td>
            <Table.Td>{entry?.counterpartyName ?? "-"}</Table.Td>
            <Table.Td>{entry?.status ?? "-"}</Table.Td>
            <Table.Td ta="right">
              <Group gap={4} justify="flex-end" wrap="nowrap">
                {assignmentState === "assigned" ? (
                  <Tooltip label="Unassign">
                    <ActionIcon
                      variant="subtle"
                      color="orange"
                      onClick={() => onUnassign(attachment.id)}
                      loading={unassignPending}
                      aria-label="Unassign"
                    >
                      <IconLinkOff size={14} />
                    </ActionIcon>
                  </Tooltip>
                ) : (
                  <Tooltip label="Delete">
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      onClick={() => onRemove(attachment.id)}
                      loading={removePending}
                      aria-label="Delete"
                    >
                      <IconTrash size={14} />
                    </ActionIcon>
                  </Tooltip>
                )}
              </Group>
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  )
}
```

- [ ] **Step 2: Run web type check and fix compile errors**

Run:

```bash
vp run --filter web check-types
```

Expected: PASS after adjusting inferred TRPC row types if generated client types require narrower annotations.

- [ ] **Step 3: Regenerate route tree**

Run:

```bash
vp check
```

Expected: PASS and `apps/web/src/routeTree.gen.ts` includes the `/documents` route.

- [ ] **Step 4: Commit**

Commit:

```bash
git add apps/web/src/routes/_authenticated/documents.tsx apps/web/src/routeTree.gen.ts
git commit -m "feat: add global documents page"
```

---

### Task 5: Full Verification And Browser Smoke

**Files:**
- Modify files only if verification finds issues in Tasks 1-4.

**Interfaces:**
- Consumes completed backend API and `/documents` route.
- Produces verified working global document workflow.

- [ ] **Step 1: Run focused tests**

Run:

```bash
vp test packages/db/src/repositories/bank-statement-attachments.test.ts packages/application/src/services/bank-statement-attachments.test.ts packages/api/src/routers/bank-statement-attachments.test.ts apps/web/src/lib/app-navigation.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run full checks**

Run:

```bash
vp check
```

Expected: PASS.

- [ ] **Step 3: Run full test suite**

Run:

```bash
vp test
```

Expected: PASS. If there is a pre-existing full-suite discovery failure, capture the exact failing output and still run all focused tests.

- [ ] **Step 4: Start dev server**

Run:

```bash
vp run dev:web
```

Expected: dev server prints a local URL, usually `http://localhost:5173`.

- [ ] **Step 5: Browser-validate**

Open the local URL and verify:

- `/documents` appears in the main navigation.
- The `Documents` nav item shows the unassigned badge when unassigned documents exist.
- `/documents` defaults to `Unassigned`.
- `Unassigned` rows show file, uploaded date, assignment select, and delete.
- `Assigned` rows show legal entity, bank account, entry date, signed amount, counterparty, and entry status.
- `All` shows both row types without implying a legal entity for unassigned rows.
- Preview opens from both assigned and unassigned rows.
- Assign moves an unassigned document out of the unassigned queue.
- Unassign moves an assigned document back to the unassigned queue.
- Delete is available only for unassigned rows.

- [ ] **Step 6: Commit verification fixes**

If Step 1-5 required fixes, commit them:

```bash
git add packages/db/src/repositories/bank-statement-attachments.ts packages/db/src/repositories/bank-statement-attachments.test.ts packages/application/src/services/bank-statement-attachments.ts packages/application/src/services/bank-statement-attachments.test.ts packages/api/src/routers/bank-statement-attachments.ts packages/api/src/routers/bank-statement-attachments.test.ts apps/web/src/lib/app-navigation.ts apps/web/src/lib/app-navigation.test.ts apps/web/src/routes/_authenticated/documents.tsx apps/web/src/routeTree.gen.ts
git commit -m "fix: complete global documents verification"
```

Expected: no commit is created if there were no verification fixes.
