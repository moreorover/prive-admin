# Document Match Drawer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the unclear inline document assignment select with a focused `Match` drawer that shows the document beside pending bank entry candidates with legal entity context.

**Architecture:** Add an explicit `bankStatementEntries.listMatchCandidates` TRPC query that returns pending entries using the existing entry repository shape, including `bankAccount.legalEntity`. Update the global Documents route to open a drawer from each unassigned row, search the loaded candidates client-side, and run the existing attachment assignment mutation from a clear `Match document` action.

**Tech Stack:** TypeScript, React, Mantine, TanStack Router, TanStack Query, TRPC, Drizzle ORM, Vite+, Vitest.

## Global Constraints

- Work on branch `global-documents-page`.
- Replace inline `Pick entry...` assignment on the global Documents page with a `Match` button.
- Clicking `Match` opens a drawer focused on one document.
- The drawer shows filename, uploaded timestamp, preview action, and pending candidate bank entries.
- Candidate rows show legal entity name, bank account display name and bank name, entry date, signed amount, counterparty name, and entry status.
- Search is client-side over the currently loaded 100 candidate entries.
- The final action name is `Match document`.
- Reuse the existing assignment mutation and invalidation behavior.
- Do not change upload, preview, unassign, or delete behavior.
- Do not redesign bank statement import or matching logic.
- Run focused backend tests.
- Run `vp check`.
- Run `vp test`.
- Browser-validate that `Match` opens the drawer, candidate rows show legal entity context, preview still opens, and `Match document` assigns a document.

---

## File Structure

- Modify `packages/application/src/services/bank-statement-entries.ts`
  - Add `listBankStatementEntryMatchCandidates`.
  - Reuse `fetchBankStatementEntries` with `status: "PENDING"`.

- Create `packages/application/src/services/bank-statement-entries.test.ts`
  - Verify service forwarding for match candidates.

- Modify `packages/api/src/routers/bank-statement-entries.ts`
  - Add `listMatchCandidates` query with `page` and `pageSize`.

- Create `packages/api/src/routers/bank-statement-entries.test.ts`
  - Verify router returns the standard page envelope and applies page offset.

- Modify `apps/web/src/routes/_authenticated/documents.tsx`
  - Remove the inline assignment select from `DocumentsTable`.
  - Add `MatchDocumentDrawer`.
  - Add a `Match` button for unassigned rows.
  - Keep assigned rows, unassign, delete, upload, preview, and pagination behavior.

---

### Task 1: Add Match Candidate Service And Router Query

**Files:**
- Modify: `packages/application/src/services/bank-statement-entries.ts`
- Create: `packages/application/src/services/bank-statement-entries.test.ts`
- Modify: `packages/api/src/routers/bank-statement-entries.ts`
- Create: `packages/api/src/routers/bank-statement-entries.test.ts`

**Interfaces:**
- Consumes: `listBankStatementEntries({ pageSize, offset, status: "PENDING" })`.
- Produces:

```ts
export async function listBankStatementEntryMatchCandidates(input: {
  pageSize: number
  offset: number
}) {
  return fetchBankStatementEntries(undefined, { ...input, status: "PENDING" })
}
```

- Produces TRPC query: `bankStatementEntries.listMatchCandidates({ page, pageSize })`.

- [ ] **Step 1: Write failing service test**

Create `packages/application/src/services/bank-statement-entries.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from "vite-plus/test"

import { listBankStatementEntryMatchCandidates } from "./bank-statement-entries"

const dbMock = vi.hoisted(() => ({
  listBankStatementEntries: vi.fn(),
}))

vi.mock("@prive-admin-tanstack/db", () => dbMock)

describe("bank statement entry service", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("lists pending match candidates with paging", async () => {
    dbMock.listBankStatementEntries.mockResolvedValue({ items: [], totalCount: 0 })

    await listBankStatementEntryMatchCandidates({ pageSize: 100, offset: 200 })

    expect(dbMock.listBankStatementEntries).toHaveBeenCalledWith(undefined, {
      pageSize: 100,
      offset: 200,
      status: "PENDING",
    })
  })
})
```

- [ ] **Step 2: Write failing router test**

Create `packages/api/src/routers/bank-statement-entries.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from "vite-plus/test"

import { bankStatementEntriesRouter } from "./bank-statement-entries"

const servicesMock = vi.hoisted(() => ({
  findBankAccountForIban: vi.fn(),
  getBankStatementEntry: vi.fn(),
  ignoreBankStatementEntry: vi.fn(),
  importBankStatementEntries: vi.fn(),
  listBankStatementEntries: vi.fn(),
  listBankStatementEntryMatchCandidates: vi.fn(),
  parseBankCsv: vi.fn(),
  undoBankStatementEntry: vi.fn(),
}))

vi.mock("@prive-admin-tanstack/application/services", () => servicesMock)

const ctx = { session: { user: { id: "user-1" } } } as never

describe("bank statement entries router", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("lists match candidates in the standard page envelope", async () => {
    const caller = bankStatementEntriesRouter.createCaller(ctx)
    const rows = [
      {
        id: "entry-1",
        bankAccount: {
          id: "bank-account-1",
          displayName: "Main account",
          bankName: "Swedbank",
          legalEntity: { id: "legal-entity-1", name: "Prive LT" },
        },
      },
    ]
    servicesMock.listBankStatementEntryMatchCandidates.mockResolvedValue({ items: rows, totalCount: 12 })

    const result = await caller.listMatchCandidates({ page: 3, pageSize: 100 })

    expect(result).toEqual({ items: rows, page: 3, pageSize: 100, totalCount: 12 })
    expect(servicesMock.listBankStatementEntryMatchCandidates).toHaveBeenCalledWith({
      pageSize: 100,
      offset: 200,
    })
  })
})
```

- [ ] **Step 3: Run service and router tests to verify failure**

Run:

```bash
vp test packages/application/src/services/bank-statement-entries.test.ts packages/api/src/routers/bank-statement-entries.test.ts
```

Expected: FAIL because `listBankStatementEntryMatchCandidates` and `listMatchCandidates` do not exist yet.

- [ ] **Step 4: Implement service wrapper**

Modify `packages/application/src/services/bank-statement-entries.ts` after `listBankStatementEntries`:

```ts
export async function listBankStatementEntryMatchCandidates(input: { pageSize: number; offset: number }) {
  return fetchBankStatementEntries(undefined, {
    pageSize: input.pageSize,
    offset: input.offset,
    status: "PENDING",
  })
}
```

- [ ] **Step 5: Implement router query**

Modify imports in `packages/api/src/routers/bank-statement-entries.ts`:

```ts
import {
  findBankAccountForIban,
  getBankStatementEntry,
  ignoreBankStatementEntry,
  importBankStatementEntries,
  listBankStatementEntries,
  listBankStatementEntryMatchCandidates,
  undoBankStatementEntry,
} from "@prive-admin-tanstack/application/services"
```

Add after the existing `list` query:

```ts
  listMatchCandidates: protectedProcedure.input(pageSchema).query(async ({ input }) => {
    try {
      const result = await listBankStatementEntryMatchCandidates({
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
vp test packages/application/src/services/bank-statement-entries.test.ts packages/api/src/routers/bank-statement-entries.test.ts
```

Expected: PASS.

Commit:

```bash
git add packages/application/src/services/bank-statement-entries.ts packages/application/src/services/bank-statement-entries.test.ts packages/api/src/routers/bank-statement-entries.ts packages/api/src/routers/bank-statement-entries.test.ts
git commit -m "feat: add bank entry match candidates"
```

---

### Task 2: Replace Inline Assignment With Match Drawer

**Files:**
- Modify: `apps/web/src/routes/_authenticated/documents.tsx`

**Interfaces:**
- Consumes: `trpc.bankStatementEntries.listMatchCandidates.queryOptions({ page, pageSize: 100 })`.
- Consumes existing assignment mutation: `trpc.bankStatementAttachments.assign`.
- Produces component:

```ts
type MatchableDocument = {
  id: string
  originalName: string
  contentType: string
  uploadedAt: string | Date
}
```

- Produces UI action: `Match` opens drawer; `Match document` assigns and closes drawer.

- [ ] **Step 1: Update route state and candidate query**

In `apps/web/src/routes/_authenticated/documents.tsx`, replace `assignableEntriesPage` state with drawer state:

```ts
const [matchingDocument, setMatchingDocument] = useState<MatchableDocument | null>(null)
const [candidatePage, setCandidatePage] = useState(1)
```

Replace the `bankStatementEntries.list` query with:

```ts
const { data: matchCandidatesData, isError: matchCandidatesIsError } = useQuery(
  trpc.bankStatementEntries.listMatchCandidates.queryOptions({
    page: candidatePage,
    pageSize: ASSIGNABLE_ENTRIES_PAGE_SIZE,
  }),
)
const matchCandidates = matchCandidatesData?.items ?? []
const matchCandidatesTotalCount = matchCandidatesData?.totalCount ?? 0
const matchCandidatesTotalPages = Math.max(1, Math.ceil(matchCandidatesTotalCount / ASSIGNABLE_ENTRIES_PAGE_SIZE))
```

- [ ] **Step 2: Change assign success to close drawer**

In the existing `assign` mutation `onSuccess`, add:

```ts
setMatchingDocument(null)
```

before `await invalidate()`.

- [ ] **Step 3: Replace table assignment props**

Remove `entryOptions`, `assignPending`, and `onAssign` props from `DocumentsTable`.

Add:

```ts
onMatch: (document: MatchableDocument) => void
```

Pass it from the page:

```tsx
onMatch={setMatchingDocument}
```

- [ ] **Step 4: Replace inline select with Match button**

In `DocumentsTable`, replace the unassigned `Select` with:

```tsx
<Button size="xs" variant="default" onClick={() => onMatch(attachment)}>
  Match
</Button>
```

Add `Button` to the Mantine imports and remove `Select` if no longer used outside the drawer.

- [ ] **Step 5: Add drawer component**

Add this component below `DocumentsTable`:

```tsx
function MatchDocumentDrawer({
  document,
  candidates,
  candidatesIsError,
  candidatePage,
  candidateTotalPages,
  candidateTotalCount,
  assignPending,
  onCandidatePageChange,
  onClose,
  onMatch,
  onPreview,
}: {
  document: MatchableDocument | null
  candidates: Array<{
    id: string
    date: string
    amount: number
    currency: string
    direction: string
    counterpartyName: string | null
    status: string
    bankAccount: {
      id: string
      displayName: string
      bankName: string | null
      legalEntity: { id: string; name: string }
    }
  }>
  candidatesIsError: boolean
  candidatePage: number
  candidateTotalPages: number
  candidateTotalCount: number
  assignPending: boolean
  onCandidatePageChange: (page: number) => void
  onClose: () => void
  onMatch: (entryId: string) => void
  onPreview: (attachment: AttachmentPreview) => void
}) {
  const [search, setSearch] = useState("")
  const query = search.trim().toLowerCase()
  const filteredCandidates = query
    ? candidates.filter((candidate) => {
        const amount = `${candidate.direction === "C" ? "+" : "-"}${formatMinor(
          candidate.amount,
          candidate.currency as Currency,
        )}`
        return [
          candidate.date,
          amount,
          candidate.counterpartyName,
          candidate.status,
          candidate.bankAccount.displayName,
          candidate.bankAccount.bankName,
          candidate.bankAccount.legalEntity.name,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query))
      })
    : candidates

  return (
    <Drawer opened={!!document} onClose={onClose} title="Match document" position="right" size="xl">
      {document ? (
        <Stack gap="md">
          <Section padding="md">
            <Stack gap={4}>
              <Text fw={600} style={{ wordBreak: "break-all" }}>
                {document.originalName}
              </Text>
              <Text size="xs" c="dimmed">
                Uploaded {new Date(document.uploadedAt).toLocaleString()}
              </Text>
              <Button
                size="xs"
                variant="default"
                onClick={() =>
                  onPreview({
                    id: document.id,
                    originalName: document.originalName,
                    contentType: document.contentType,
                  })
                }
              >
                Preview document
              </Button>
            </Stack>
          </Section>

          <TextInput
            label="Search candidates"
            placeholder="Legal entity, bank account, counterparty, amount, or date"
            value={search}
            onChange={(event) => setSearch(event.currentTarget.value)}
          />

          {candidatesIsError ? (
            <Text size="sm" c="red">
              Unable to load match candidates.
            </Text>
          ) : filteredCandidates.length > 0 ? (
            <Stack gap="xs">
              {filteredCandidates.map((candidate) => (
                <Group key={candidate.id} justify="space-between" align="flex-start" wrap="nowrap">
                  <Stack gap={2}>
                    <Text size="sm" fw={600}>
                      {candidate.bankAccount.legalEntity.name}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {candidate.bankAccount.displayName}
                      {candidate.bankAccount.bankName ? ` · ${candidate.bankAccount.bankName}` : ""}
                    </Text>
                    <Text size="sm">
                      {candidate.date} · {candidate.direction === "C" ? "+" : "-"}
                      {formatMinor(candidate.amount, candidate.currency as Currency)}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {candidate.counterpartyName ?? "-"} · {candidate.status}
                    </Text>
                  </Stack>
                  <Button size="xs" loading={assignPending} onClick={() => onMatch(candidate.id)}>
                    Match document
                  </Button>
                </Group>
              ))}
            </Stack>
          ) : (
            <Text size="sm" c="dimmed">
              No matching candidates on this page.
            </Text>
          )}

          {candidateTotalCount > ASSIGNABLE_ENTRIES_PAGE_SIZE ? (
            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                {candidateTotalCount} pending entries · Page {Math.min(candidatePage, candidateTotalPages)} of{" "}
                {candidateTotalPages}
              </Text>
              <Pagination
                size="sm"
                total={candidateTotalPages}
                value={Math.min(candidatePage, candidateTotalPages)}
                onChange={onCandidatePageChange}
              />
            </Group>
          ) : null}
        </Stack>
      ) : null}
    </Drawer>
  )
}
```

Add `Drawer`, `Button`, and `TextInput` to Mantine imports.

- [ ] **Step 6: Render the drawer**

Render after `AttachmentPreviewDialog`:

```tsx
<MatchDocumentDrawer
  document={matchingDocument}
  candidates={matchCandidates}
  candidatesIsError={matchCandidatesIsError}
  candidatePage={candidatePage}
  candidateTotalPages={matchCandidatesTotalPages}
  candidateTotalCount={matchCandidatesTotalCount}
  assignPending={assign.isPending}
  onCandidatePageChange={setCandidatePage}
  onClose={() => setMatchingDocument(null)}
  onMatch={(entryId) => {
    if (matchingDocument) assign.mutate({ id: matchingDocument.id, entryId })
  }}
  onPreview={setPreviewAttachment}
/>
```

- [ ] **Step 7: Run web type check and commit**

Run:

```bash
vp run --filter web check-types
```

Expected: PASS.

Run:

```bash
vp check
```

Expected: PASS.

Commit:

```bash
git add apps/web/src/routes/_authenticated/documents.tsx
git commit -m "feat: add document match drawer"
```

---

### Task 3: Verification And Browser Smoke

**Files:**
- Modify files only if verification finds issues in Tasks 1-2.

**Interfaces:**
- Consumes completed `listMatchCandidates` query and drawer UI.
- Produces verified matching drawer behavior.

- [ ] **Step 1: Run focused tests**

Run:

```bash
vp test packages/application/src/services/bank-statement-entries.test.ts packages/api/src/routers/bank-statement-entries.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run full check**

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

Expected: PASS.

- [ ] **Step 4: Browser-validate**

Run:

```bash
vp run dev:web
```

Expected: local server starts, usually on `http://localhost:3001` or the next open port.

Validate in the browser:

- `/documents` defaults to `Unassigned`.
- Each unassigned row has `Match`, not `Pick entry...`.
- Clicking `Match` opens a drawer titled `Match document`.
- Drawer shows document filename and uploaded timestamp.
- `Preview document` opens the existing preview dialog.
- Candidate rows show legal entity, bank account, date, signed amount, counterparty, and status.
- Candidate search filters the currently visible candidate page.
- Clicking `Match document` assigns the document and closes the drawer.
- Delete remains available only from the unassigned row action.

- [ ] **Step 5: Commit verification fixes**

If verification required fixes, commit them:

```bash
git add packages/application/src/services/bank-statement-entries.ts packages/application/src/services/bank-statement-entries.test.ts packages/api/src/routers/bank-statement-entries.ts packages/api/src/routers/bank-statement-entries.test.ts apps/web/src/routes/_authenticated/documents.tsx
git commit -m "fix: complete document match drawer verification"
```

Expected: skip this commit if no verification fixes were needed.
