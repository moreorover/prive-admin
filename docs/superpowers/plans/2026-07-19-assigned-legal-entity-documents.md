# Assigned Legal Entity Documents Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an assigned-documents mode to the legal entity Documents route so users can audit and unassign documents matched to the current legal entity's bank entries.

**Architecture:** Add a focused backend query that returns assigned attachments enriched with matched bank statement entry and bank account context, scoped by `legalEntityId`. Expose it through application services and TRPC in the standard paged envelope. Update the Documents route to use one status control for the existing global unassigned queue and the new current-entity assigned ledger.

**Tech Stack:** TypeScript, React, Mantine, TanStack Router, TanStack Query, TRPC, Drizzle ORM, Vite+, Vitest.

## Global Constraints

- Work on branch `legal-entity-assigned-documents`.
- Build on PR #241's legal-entity navigation branch.
- Unassigned documents remain global.
- Assigned documents are scoped to the current legal entity through the matched bank statement entry's bank account.
- Do not add deleting assigned documents.
- Do not change upload behavior.
- Do not redesign bank statement entry matching.
- Use one Documents page with a compact status control.
- Run `vp check`.
- Run web type-checking.
- Run focused new backend tests.
- Run `vp test` and document the known full-suite discovery failure if it still occurs.

---

## File Structure

- Modify `packages/db/src/repositories/bank-statement-attachments.ts`
  - Add `listAssignedBankStatementAttachments`.
  - Return paged assigned attachment rows with entry and bank account context.

- Create `packages/db/src/repositories/bank-statement-attachments.test.ts`
  - Verify the repository builds the assigned-document query from attachments, joins entries and accounts, filters by legal entity, and returns paged data.

- Modify `packages/application/src/services/bank-statement-attachments.ts`
  - Add `listAssignedBankStatementAttachments` service wrapper.

- Create `packages/application/src/services/bank-statement-attachments.test.ts`
  - Verify service forwarding to the database layer.

- Modify `packages/api/src/routers/bank-statement-attachments.ts`
  - Add `listAssigned` query with `legalEntityId`, `page`, and `pageSize`.

- Create `packages/api/src/routers/bank-statement-attachments.test.ts`
  - Verify router paging envelope and service call arguments.

- Modify `apps/web/src/routes/_authenticated/legal-entities/$legalEntityId/documents.tsx`
  - Add status control.
  - Keep existing unassigned behavior.
  - Add assigned table, pagination, preview, and unassign action.

---

### Task 1: Add Assigned Attachment Repository Query

**Files:**
- Modify: `packages/db/src/repositories/bank-statement-attachments.ts`
- Create: `packages/db/src/repositories/bank-statement-attachments.test.ts`

**Interfaces:**
- Produces:
  - `listAssignedBankStatementAttachments(database?: Db, input: { legalEntityId: string; pageSize: number; offset: number }): Promise<{ items: AssignedBankStatementAttachmentRow[]; totalCount: number }>`
  - `type AssignedBankStatementAttachmentRow = { attachment: typeof bankStatementAttachment.$inferSelect; entry: typeof bankStatementEntry.$inferSelect; bankAccount: Pick<typeof bankAccount.$inferSelect, "id" | "displayName" | "bankName" | "currency"> }`

- [ ] **Step 1: Write the repository test**

Create `packages/db/src/repositories/bank-statement-attachments.test.ts`:

```ts
import { describe, expect, it, vi } from "vite-plus/test"

import { bankAccount } from "../schema/bank-account"
import { bankStatementAttachment } from "../schema/bank-statement-attachment"
import { bankStatementEntry } from "../schema/bank-statement-entry"
import { listAssignedBankStatementAttachments } from "./bank-statement-attachments"

vi.mock("../index", () => ({ db: {} }))

describe("bank statement attachment repository", () => {
  it("lists assigned attachments for one legal entity with entry and bank account context", async () => {
    const assignedRows = [
      {
        attachment: {
          id: "attachment-1",
          bankStatementEntryId: "entry-1",
          r2Key: "statement_uploads/file.pdf",
          originalName: "receipt.pdf",
          contentType: "application/pdf",
          size: 1234,
          uploadedById: null,
          uploadedAt: new Date("2026-07-19T10:00:00.000Z"),
        },
        entry: {
          id: "entry-1",
          bankAccountId: "bank-account-1",
          externalRef: "ref-1",
          docNumber: null,
          date: "2026-07-18",
          amount: 12345,
          currency: "EUR",
          direction: "D",
          counterpartyName: "Vendor",
          counterpartyIban: null,
          counterpartyBank: null,
          swift: null,
          purpose: null,
          transactionType: null,
          status: "PENDING",
          importedAt: new Date("2026-07-18T10:00:00.000Z"),
          createdAt: new Date("2026-07-18T10:00:00.000Z"),
          updatedAt: new Date("2026-07-18T10:00:00.000Z"),
        },
        bankAccount: {
          id: "bank-account-1",
          displayName: "Main account",
          bankName: "Swedbank",
          currency: "EUR",
        },
      },
    ]

    const countRows = [{ totalCount: 7 }]
    const calls: {
      from: unknown[]
      innerJoin: Array<{ table: unknown; condition: unknown }>
      limit: number[]
      offset: number[]
      orderBy: unknown[][]
      where: unknown[]
    } = {
      from: [],
      innerJoin: [],
      limit: [],
      offset: [],
      orderBy: [],
      where: [],
    }

    const itemsBuilder = {
      from: vi.fn((table: unknown) => {
        calls.from.push(table)
        return itemsBuilder
      }),
      innerJoin: vi.fn((table: unknown, condition: unknown) => {
        calls.innerJoin.push({ table, condition })
        return itemsBuilder
      }),
      limit: vi.fn((value: number) => {
        calls.limit.push(value)
        return itemsBuilder
      }),
      offset: vi.fn(async (value: number) => {
        calls.offset.push(value)
        return assignedRows
      }),
      orderBy: vi.fn((...values: unknown[]) => {
        calls.orderBy.push(values)
        return itemsBuilder
      }),
      where: vi.fn((condition: unknown) => {
        calls.where.push(condition)
        return itemsBuilder
      }),
    }
    const countBuilder = {
      from: vi.fn((table: unknown) => {
        calls.from.push(table)
        return countBuilder
      }),
      innerJoin: vi.fn((table: unknown, condition: unknown) => {
        calls.innerJoin.push({ table, condition })
        return countBuilder
      }),
      where: vi.fn(async (condition: unknown) => {
        calls.where.push(condition)
        return countRows
      }),
    }
    const database = {
      select: vi.fn().mockReturnValueOnce(itemsBuilder).mockReturnValueOnce(countBuilder),
    }

    const result = await listAssignedBankStatementAttachments(database as never, {
      legalEntityId: "legal-entity-1",
      pageSize: 25,
      offset: 50,
    })

    expect(result).toEqual({ items: assignedRows, totalCount: 7 })
    expect(database.select).toHaveBeenCalledTimes(2)
    expect(calls.from).toEqual([bankStatementAttachment, bankStatementAttachment])
    expect(calls.innerJoin.map((call) => call.table)).toEqual([
      bankStatementEntry,
      bankAccount,
      bankStatementEntry,
      bankAccount,
    ])
    expect(calls.where).toHaveLength(2)
    expect(calls.orderBy).toHaveLength(1)
    expect(calls.limit).toEqual([25])
    expect(calls.offset).toEqual([50])
  })
})
```

- [ ] **Step 2: Run the repository test to verify it fails**

Run:

```bash
vp test packages/db/src/repositories/bank-statement-attachments.test.ts
```

Expected: FAIL because `listAssignedBankStatementAttachments` is not exported.

- [ ] **Step 3: Implement the repository query**

Modify `packages/db/src/repositories/bank-statement-attachments.ts`:

```ts
import { and, count, desc, eq, gte, isNotNull, isNull, lte } from "drizzle-orm"
```

Add after `listBankStatementAttachments`:

```ts
export type AssignedBankStatementAttachmentRow = {
  attachment: typeof bankStatementAttachment.$inferSelect
  entry: typeof bankStatementEntry.$inferSelect
  bankAccount: Pick<typeof bankAccount.$inferSelect, "id" | "displayName" | "bankName" | "currency">
}

export async function listAssignedBankStatementAttachments(
  database: Db = db,
  input: { legalEntityId: string; pageSize: number; offset: number },
) {
  const where = and(
    isNotNull(bankStatementAttachment.bankStatementEntryId),
    eq(bankAccount.legalEntityId, input.legalEntityId),
  )

  const items = await database
    .select({
      attachment: bankStatementAttachment,
      entry: bankStatementEntry,
      bankAccount: {
        id: bankAccount.id,
        displayName: bankAccount.displayName,
        bankName: bankAccount.bankName,
        currency: bankAccount.currency,
      },
    })
    .from(bankStatementAttachment)
    .innerJoin(bankStatementEntry, eq(bankStatementAttachment.bankStatementEntryId, bankStatementEntry.id))
    .innerJoin(bankAccount, eq(bankStatementEntry.bankAccountId, bankAccount.id))
    .where(where)
    .orderBy(desc(bankStatementEntry.date), desc(bankStatementAttachment.uploadedAt))
    .limit(input.pageSize)
    .offset(input.offset)

  const [countRow] = await database
    .select({ totalCount: count() })
    .from(bankStatementAttachment)
    .innerJoin(bankStatementEntry, eq(bankStatementAttachment.bankStatementEntryId, bankStatementEntry.id))
    .innerJoin(bankAccount, eq(bankStatementEntry.bankAccountId, bankAccount.id))
    .where(where)

  return { items, totalCount: countRow?.totalCount ?? 0 }
}
```

- [ ] **Step 4: Run the repository test**

Run:

```bash
vp test packages/db/src/repositories/bank-statement-attachments.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add packages/db/src/repositories/bank-statement-attachments.ts packages/db/src/repositories/bank-statement-attachments.test.ts
git commit -m "feat: add assigned document repository query"
```

---

### Task 2: Add Application Service Wrapper

**Files:**
- Modify: `packages/application/src/services/bank-statement-attachments.ts`
- Create: `packages/application/src/services/bank-statement-attachments.test.ts`

**Interfaces:**
- Consumes: `listAssignedBankStatementAttachments` from `@prive-admin-tanstack/db`.
- Produces: service function `listAssignedBankStatementAttachments(input: { legalEntityId: string; pageSize: number; offset: number })`.

- [ ] **Step 1: Write the service test**

Create `packages/application/src/services/bank-statement-attachments.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from "vite-plus/test"

import { listAssignedBankStatementAttachments } from "./bank-statement-attachments"

const dbMock = vi.hoisted(() => ({
  listAssignedBankStatementAttachments: vi.fn(),
}))

vi.mock("@prive-admin-tanstack/db", () => dbMock)

describe("bank statement attachment service", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("forwards assigned document paging and legal entity scope to the database layer", async () => {
    dbMock.listAssignedBankStatementAttachments.mockResolvedValue({ items: [], totalCount: 0 })

    await listAssignedBankStatementAttachments({
      legalEntityId: "legal-entity-1",
      pageSize: 25,
      offset: 50,
    })

    expect(dbMock.listAssignedBankStatementAttachments).toHaveBeenCalledWith(undefined, {
      legalEntityId: "legal-entity-1",
      pageSize: 25,
      offset: 50,
    })
  })
})
```

- [ ] **Step 2: Run the service test to verify it fails**

Run:

```bash
vp test packages/application/src/services/bank-statement-attachments.test.ts
```

Expected: FAIL because the service export does not exist.

- [ ] **Step 3: Implement the service wrapper**

Modify the import aliases in `packages/application/src/services/bank-statement-attachments.ts`:

```ts
import {
  deleteBankStatementAttachment as removeBankStatementAttachment,
  listAssignedBankStatementAttachments as fetchAssignedBankStatementAttachments,
  listBankStatementAttachmentExportRows as fetchBankStatementAttachmentExportRows,
  listBankStatementAttachments as fetchBankStatementAttachments,
  ...
} from "@prive-admin-tanstack/db"
```

Add after `listBankStatementAttachments`:

```ts
export async function listAssignedBankStatementAttachments(input: {
  legalEntityId: string
  pageSize: number
  offset: number
}) {
  return fetchAssignedBankStatementAttachments(undefined, input)
}
```

- [ ] **Step 4: Run the service test**

Run:

```bash
vp test packages/application/src/services/bank-statement-attachments.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add packages/application/src/services/bank-statement-attachments.ts packages/application/src/services/bank-statement-attachments.test.ts
git commit -m "feat: add assigned document service"
```

---

### Task 3: Add TRPC Assigned Documents Query

**Files:**
- Modify: `packages/api/src/routers/bank-statement-attachments.ts`
- Create: `packages/api/src/routers/bank-statement-attachments.test.ts`

**Interfaces:**
- Consumes: service `listAssignedBankStatementAttachments`.
- Produces: `trpc.bankStatementAttachments.listAssigned.queryOptions({ legalEntityId, page, pageSize })`.

- [ ] **Step 1: Write the router test**

Create `packages/api/src/routers/bank-statement-attachments.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from "vite-plus/test"

import { bankStatementAttachmentsRouter } from "./bank-statement-attachments"

const servicesMock = vi.hoisted(() => ({
  assignBankStatementAttachment: vi.fn(),
  countBankStatementAttachments: vi.fn(),
  deleteBankStatementAttachmentFile: vi.fn(),
  listAssignedBankStatementAttachments: vi.fn(),
  listBankStatementAttachments: vi.fn(),
  unassignBankStatementAttachment: vi.fn(),
}))

vi.mock("@prive-admin-tanstack/application/services", () => servicesMock)

const ctx = { session: { user: { id: "user-1" } } } as never

describe("bank statement attachments router", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("lists assigned documents in the standard page envelope", async () => {
    const caller = bankStatementAttachmentsRouter.createCaller(ctx)
    const rows = [{ attachment: { id: "attachment-1" }, entry: { id: "entry-1" }, bankAccount: { id: "account-1" } }]
    servicesMock.listAssignedBankStatementAttachments.mockResolvedValue({ items: rows, totalCount: 42 })

    const result = await caller.listAssigned({
      legalEntityId: "legal-entity-1",
      page: 3,
      pageSize: 10,
    })

    expect(result).toEqual({ items: rows, page: 3, pageSize: 10, totalCount: 42 })
    expect(servicesMock.listAssignedBankStatementAttachments).toHaveBeenCalledWith({
      legalEntityId: "legal-entity-1",
      pageSize: 10,
      offset: 20,
    })
  })
})
```

- [ ] **Step 2: Run the router test to verify it fails**

Run:

```bash
vp test packages/api/src/routers/bank-statement-attachments.test.ts
```

Expected: FAIL because `listAssigned` does not exist.

- [ ] **Step 3: Implement `listAssigned`**

Modify `packages/api/src/routers/bank-statement-attachments.ts` imports:

```ts
import {
  assignBankStatementAttachment,
  countBankStatementAttachments,
  deleteBankStatementAttachmentFile,
  listAssignedBankStatementAttachments,
  listBankStatementAttachments,
  unassignBankStatementAttachment,
} from "@prive-admin-tanstack/application/services"
```

Add pagination imports:

```ts
import { getOffset, pagedResult, pageSchema } from "../pagination"
```

Add inside `bankStatementAttachmentsRouter` after `list`:

```ts
  listAssigned: protectedProcedure
    .input(
      pageSchema.extend({
        legalEntityId: z.string().min(1),
      }),
    )
    .query(async ({ input }) => {
      try {
        const result = await listAssignedBankStatementAttachments({
          legalEntityId: input.legalEntityId,
          pageSize: input.pageSize,
          offset: getOffset(input),
        })
        return pagedResult(result.items, input, result.totalCount)
      } catch (error) {
        throw toTrpcError(error)
      }
    }),
```

- [ ] **Step 4: Run the router test**

Run:

```bash
vp test packages/api/src/routers/bank-statement-attachments.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```bash
git add packages/api/src/routers/bank-statement-attachments.ts packages/api/src/routers/bank-statement-attachments.test.ts
git commit -m "feat: expose assigned document query"
```

---

### Task 4: Add Assigned Mode To Documents Route

**Files:**
- Modify: `apps/web/src/routes/_authenticated/legal-entities/$legalEntityId/documents.tsx`

**Interfaces:**
- Consumes:
  - `trpc.bankStatementAttachments.listAssigned.queryOptions({ legalEntityId, page, pageSize })`
  - `trpc.bankStatementAttachments.unassign.mutationOptions()`

- [ ] **Step 1: Add assigned-mode imports and constants**

Modify imports in `apps/web/src/routes/_authenticated/legal-entities/$legalEntityId/documents.tsx`:

```tsx
import {
  ActionIcon,
  Button,
  FileInput,
  Group,
  Pagination,
  SegmentedControl,
  Select,
  Stack,
  Table,
  Text,
  Tooltip,
  UnstyledButton,
} from "@mantine/core"
import { IconLinkOff, IconTrash } from "@tabler/icons-react"
```

Add after `ASSIGNABLE_ENTRIES_PAGE_SIZE`:

```ts
const ASSIGNED_DOCUMENTS_PAGE_SIZE = 25
type DocumentStatus = "unassigned" | "assigned"
```

- [ ] **Step 2: Add state and assigned query**

Inside `DocumentsTab`, add:

```tsx
const { legalEntityId } = Route.useParams()
const [status, setStatus] = useState<DocumentStatus>("unassigned")
const [assignedDocumentsPage, setAssignedDocumentsPage] = useState(1)
```

Add assigned query after `unassignedDocuments`:

```tsx
const { data: assignedDocumentsData, isError: assignedDocumentsIsError } = useQuery({
  ...trpc.bankStatementAttachments.listAssigned.queryOptions({
    legalEntityId,
    page: assignedDocumentsPage,
    pageSize: ASSIGNED_DOCUMENTS_PAGE_SIZE,
  }),
  enabled: status === "assigned",
})
const assignedDocuments = assignedDocumentsData?.items ?? []
const assignedDocumentsTotalCount = assignedDocumentsData?.totalCount ?? 0
const assignedDocumentsTotalPages = Math.max(1, Math.ceil(assignedDocumentsTotalCount / ASSIGNED_DOCUMENTS_PAGE_SIZE))
const showAssignedDocumentsPagination = assignedDocumentsTotalCount > ASSIGNED_DOCUMENTS_PAGE_SIZE
```

- [ ] **Step 3: Add unassign mutation**

Add after `assign` mutation:

```tsx
const unassign = useMutation({
  ...trpc.bankStatementAttachments.unassign.mutationOptions(),
  onSuccess: async () => {
    notifications.show({ color: "green", message: "Unassigned" })
    await invalidate()
    setAssignedDocumentsPage((page) => Math.min(page, assignedDocumentsTotalPages))
  },
  onError: (err) => notifications.show({ color: "red", message: err.message }),
})
```

- [ ] **Step 4: Split rendering by status**

Replace `const items = unassignedDocuments` with:

```tsx
const statusOptions = [
  { label: `Unassigned (${unassignedDocuments.length})`, value: "unassigned" },
  { label: `Assigned (${assignedDocumentsTotalCount})`, value: "assigned" },
]
```

Replace the current `<Section ...>` block with:

```tsx
<Section
  title="Documents"
  description={
    status === "unassigned"
      ? `${unassignedDocuments.length} file${unassignedDocuments.length === 1 ? "" : "s"} waiting to be matched to bank entries.`
      : `${assignedDocumentsTotalCount} assigned document${assignedDocumentsTotalCount === 1 ? "" : "s"} for this legal entity.`
  }
  actions={
    status === "unassigned" ? (
      <FileInput
        key={fileInputKey}
        placeholder="Upload document"
        disabled={busy}
        value={null}
        onChange={(f) => {
          if (f) void upload(f)
        }}
        w={260}
        size="sm"
      />
    ) : null
  }
  padding={status === "unassigned" ? (unassignedDocuments.length > 0 ? 0 : "lg") : assignedDocuments.length > 0 ? 0 : "lg"}
>
  <Stack gap="md">
    <Group px={status === "unassigned" && unassignedDocuments.length > 0 ? "md" : 0} pt={status === "unassigned" && unassignedDocuments.length > 0 ? "md" : 0}>
      <SegmentedControl
        value={status}
        onChange={(value) => setStatus(value as DocumentStatus)}
        data={statusOptions}
        size="sm"
      />
    </Group>

    {status === "unassigned" ? (
      <UnassignedDocumentsView
        assignableEntriesTotalCount={assignableEntriesTotalCount}
        assignableEntriesTotalPages={assignableEntriesTotalPages}
        assignableEntriesPage={assignableEntriesPage}
        setAssignableEntriesPage={setAssignableEntriesPage}
        showAssignableEntriesPagination={showAssignableEntriesPagination}
        items={unassignedDocuments}
        entryOptions={entryOptions}
        assignPending={assign.isPending}
        onAssign={(id, entryId) => assign.mutate({ id, entryId })}
        removePending={remove.isPending}
        onRemove={(id) => remove.mutate({ id })}
        onPreview={setPreviewAttachment}
      />
    ) : (
      <AssignedDocumentsView
        assignedDocuments={assignedDocuments}
        assignedDocumentsIsError={assignedDocumentsIsError}
        assignedDocumentsPage={assignedDocumentsPage}
        assignedDocumentsTotalPages={assignedDocumentsTotalPages}
        assignedDocumentsTotalCount={assignedDocumentsTotalCount}
        showAssignedDocumentsPagination={showAssignedDocumentsPagination}
        setAssignedDocumentsPage={setAssignedDocumentsPage}
        unassignPending={unassign.isPending}
        onUnassign={(id) => unassign.mutate({ id })}
        onPreview={setPreviewAttachment}
      />
    )}
  </Stack>
</Section>
```

- [ ] **Step 5: Extract unassigned view**

Move the existing unassigned table/pagination JSX into a local component in the same file:

```tsx
function UnassignedDocumentsView({
  assignableEntriesTotalCount,
  assignableEntriesTotalPages,
  assignableEntriesPage,
  setAssignableEntriesPage,
  showAssignableEntriesPagination,
  items,
  entryOptions,
  assignPending,
  onAssign,
  removePending,
  onRemove,
  onPreview,
}: {
  assignableEntriesTotalCount: number
  assignableEntriesTotalPages: number
  assignableEntriesPage: number
  setAssignableEntriesPage: (page: number) => void
  showAssignableEntriesPagination: boolean
  items: Array<{
    id: string
    originalName: string
    contentType: string
    uploadedAt: string | Date
  }>
  entryOptions: Array<{ value: string; label: string }>
  assignPending: boolean
  onAssign: (id: string, entryId: string) => void
  removePending: boolean
  onRemove: (id: string) => void
  onPreview: (attachment: AttachmentPreview) => void
}) {
  return (
    <>
      {showAssignableEntriesPagination && (
        <Group justify="space-between" px="md">
          <Text size="sm" c="dimmed">
            {assignableEntriesTotalCount} pending entr{assignableEntriesTotalCount === 1 ? "y" : "ies"} · Page{" "}
            {Math.min(assignableEntriesPage, assignableEntriesTotalPages)} of {assignableEntriesTotalPages}
          </Text>
          <Pagination
            size="sm"
            total={assignableEntriesTotalPages}
            value={Math.min(assignableEntriesPage, assignableEntriesTotalPages)}
            onChange={setAssignableEntriesPage}
          />
        </Group>
      )}
      {items.length > 0 ? (
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>File</Table.Th>
              <Table.Th>Uploaded</Table.Th>
              <Table.Th w={360}>Assign to entry</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {items.map((a) => (
              <Table.Tr key={a.id}>
                <Table.Td>
                  <UnstyledButton
                    onClick={() => onPreview({ id: a.id, originalName: a.originalName, contentType: a.contentType })}
                    style={{ textAlign: "left" }}
                  >
                    <Text size="sm" td="underline" style={{ wordBreak: "break-all" }}>
                      {a.originalName}
                    </Text>
                  </UnstyledButton>
                </Table.Td>
                <Table.Td>
                  <Text size="xs" c="dimmed">
                    {new Date(a.uploadedAt).toLocaleString()}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Select
                    placeholder="Pick entry..."
                    searchable
                    data={entryOptions}
                    value={null}
                    onChange={(entryId) => {
                      if (entryId) onAssign(a.id, entryId)
                    }}
                    disabled={assignPending}
                  />
                </Table.Td>
                <Table.Td ta="right">
                  <Tooltip label="Delete">
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      onClick={() => onRemove(a.id)}
                      loading={removePending}
                      aria-label="Delete"
                    >
                      <IconTrash size={14} />
                    </ActionIcon>
                  </Tooltip>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      ) : (
        <Text size="sm" c="dimmed">
          No unassigned documents.
        </Text>
      )}
    </>
  )
}
```

- [ ] **Step 6: Add assigned view**

Add below `UnassignedDocumentsView`:

```tsx
function AssignedDocumentsView({
  assignedDocuments,
  assignedDocumentsIsError,
  assignedDocumentsPage,
  assignedDocumentsTotalPages,
  assignedDocumentsTotalCount,
  showAssignedDocumentsPagination,
  setAssignedDocumentsPage,
  unassignPending,
  onUnassign,
  onPreview,
}: {
  assignedDocuments: Array<{
    attachment: {
      id: string
      originalName: string
      contentType: string
      uploadedAt: string | Date
    }
    entry: {
      id: string
      date: string
      amount: number
      currency: string
      direction: string
      counterpartyName: string | null
      status: string
    }
    bankAccount: {
      id: string
      displayName: string
      bankName: string | null
      currency: string
    }
  }>
  assignedDocumentsIsError: boolean
  assignedDocumentsPage: number
  assignedDocumentsTotalPages: number
  assignedDocumentsTotalCount: number
  showAssignedDocumentsPagination: boolean
  setAssignedDocumentsPage: (page: number) => void
  unassignPending: boolean
  onUnassign: (id: string) => void
  onPreview: (attachment: AttachmentPreview) => void
}) {
  if (assignedDocumentsIsError) {
    return (
      <Text size="sm" c="red">
        Unable to load assigned documents.
      </Text>
    )
  }

  return (
    <>
      {showAssignedDocumentsPagination && (
        <Group justify="space-between" px="md">
          <Text size="sm" c="dimmed">
            {assignedDocumentsTotalCount} assigned document{assignedDocumentsTotalCount === 1 ? "" : "s"} · Page{" "}
            {Math.min(assignedDocumentsPage, assignedDocumentsTotalPages)} of {assignedDocumentsTotalPages}
          </Text>
          <Pagination
            size="sm"
            total={assignedDocumentsTotalPages}
            value={Math.min(assignedDocumentsPage, assignedDocumentsTotalPages)}
            onChange={setAssignedDocumentsPage}
          />
        </Group>
      )}
      {assignedDocuments.length > 0 ? (
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>File</Table.Th>
              <Table.Th>Entry</Table.Th>
              <Table.Th>Counterparty</Table.Th>
              <Table.Th>Bank account</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {assignedDocuments.map(({ attachment, entry, bankAccount }) => (
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
                  <Stack gap={2}>
                    <Text size="sm">{entry.date}</Text>
                    <Text size="xs" c="dimmed">
                      {entry.direction === "C" ? "+" : "-"}
                      {formatMinor(entry.amount, entry.currency as Currency)}
                    </Text>
                  </Stack>
                </Table.Td>
                <Table.Td>{entry.counterpartyName ?? "-"}</Table.Td>
                <Table.Td>
                  <Stack gap={2}>
                    <Text size="sm">{bankAccount.displayName}</Text>
                    {bankAccount.bankName ? (
                      <Text size="xs" c="dimmed">
                        {bankAccount.bankName}
                      </Text>
                    ) : null}
                  </Stack>
                </Table.Td>
                <Table.Td>{entry.status}</Table.Td>
                <Table.Td ta="right">
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
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      ) : (
        <Text size="sm" c="dimmed">
          No assigned documents for this legal entity.
        </Text>
      )}
    </>
  )
}
```

- [ ] **Step 7: Run checks**

Run:

```bash
vp check
vp run --filter web check-types
```

Expected: PASS.

- [ ] **Step 8: Commit**

Run:

```bash
git add 'apps/web/src/routes/_authenticated/legal-entities/$legalEntityId/documents.tsx'
git commit -m "feat: show assigned legal entity documents"
```

---

### Task 5: Final Validation

**Files:**
- Inspect: `packages/db/src/repositories/bank-statement-attachments.ts`
- Inspect: `packages/application/src/services/bank-statement-attachments.ts`
- Inspect: `packages/api/src/routers/bank-statement-attachments.ts`
- Inspect: `apps/web/src/routes/_authenticated/legal-entities/$legalEntityId/documents.tsx`

**Interfaces:**
- Consumes all prior tasks.
- Produces validated branch ready for review.

- [ ] **Step 1: Run focused tests**

Run:

```bash
vp test packages/db/src/repositories/bank-statement-attachments.test.ts
vp test packages/application/src/services/bank-statement-attachments.test.ts
vp test packages/api/src/routers/bank-statement-attachments.test.ts
vp test apps/web/src/lib/legal-entity-navigation.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run project checks**

Run:

```bash
vp check
vp run --filter web check-types
vp test
```

Expected:

- `vp check`: PASS.
- web type-checking: PASS.
- `vp test`: may fail with the known baseline discovery of `.worktrees/*` and `packages/*/dist` tests. Record the exact summary.

- [ ] **Step 3: Browser validation**

Run:

```bash
vp run dev:web
```

Inspect:

```text
/legal-entities/<existing-legal-entity-id>/documents
```

Confirm:

- Default view is `Unassigned`.
- Existing upload, assign, preview, and delete controls remain available in `Unassigned`.
- Switching to `Assigned` loads assigned documents for the current legal entity.
- Assigned rows show file, uploaded date, entry date, amount, counterparty, bank account, and status.
- `Unassign` moves a document back to `Unassigned`.
- Assigned documents from another legal entity do not appear.
- Mobile width keeps the status control and table usable.

Stop the dev server before reporting.

- [ ] **Step 4: Commit only if generated files changed**

Run:

```bash
git status --short
```

If `apps/web/src/routeTree.gen.ts` changed and the diff is generated-only:

```bash
git add apps/web/src/routeTree.gen.ts
git commit -m "chore: update route tree"
```

If no generated files changed, skip this commit.

- [ ] **Step 5: Summarize final state**

Run:

```bash
git status --short
git log --oneline -8
```

Report:

- Current branch.
- Commits created.
- Validation commands and results.
- Browser validation result.
- Known full-suite baseline failure, if present.
