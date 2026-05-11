# Document preview dialog — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users preview bank-statement attachments (PDFs, images, CSVs) in a Mantine modal without downloading.

**Architecture:** A new TanStack file route streams the R2 object through the server with `Content-Disposition: inline`. A new `<AttachmentPreviewDialog>` component dispatches on `contentType` to render an `<iframe>` (PDF), `<img>` (image), `<pre>` (text/csv), or a fallback message. Two existing consumers (`AttachmentsCell` inside the bank account detail page and `DocumentsTab`) make filenames clickable and own the dialog state at their component level.

**Tech Stack:** TanStack Start (file routes), AWS SDK v3 S3Client (R2), Mantine v7 (Modal, Anchor, UnstyledButton, Text), React Query v5, bun, oxlint + oxfmt.

**Spec:** `docs/superpowers/specs/2026-05-11-document-preview-design.md`

---

## Orientation (read once before starting)

- `apps/web/src/routes/api/*.ts` are TanStack file routes. Pattern: `createFileRoute("/api/...")({ server: { handlers: { GET: async ({ request }) => Response } } })`. Reference: `apps/web/src/routes/api/statement-attachments.export.ts`.
- R2 client: `apps/web/src/lib/r2.ts` exports `r2` (S3Client) and `bucketName`. `GetObjectCommand` returns `obj.Body` which is a Node `Readable`. Convert with `Readable.toWeb(body)` for `Response` body.
- Auth in API routes: `const session = await auth.api.getSession({ headers: request.headers })`; return 401 JSON if missing.
- DB schema for attachments: `packages/db/src/schema/bank-statement-attachment.ts`. Columns: `id`, `r2Key`, `originalName`, `contentType`, `size`, `bankStatementEntryId` (nullable).
- Mantine `Modal` with `opened` derived from `attachment !== null`. `Modal` size `"xl"`. Trigger anchor uses `UnstyledButton` so the click event is on the filename text and not the whole row.
- Branch: `feat/multi-legal-entity` (current). One commit per task.

## Conventions for this plan

- **No tests** — `apps/web` has no Vitest setup. Verification is `bun run check-types` + `bun run check` + manual smoke after Task 4.
- **Commit after every task.** Conventional Commits style. No `Co-Authored-By` line.
- **No schema changes.** No migration step. Reads existing columns only.

---

## File map (final state)

**New files:**
- `apps/web/src/routes/api/statement-attachments.preview.ts`
- `apps/web/src/components/attachment-preview-dialog.tsx`

**Modified:**
- `apps/web/src/routes/_authenticated/legal-entities/$legalEntityId/bank-accounts/$bankAccountId.tsx`
  - Lifts a `previewAttachment` state into `BankAccountShow`
  - Filename `<Text>` inside `AttachmentsCell` becomes clickable
  - `<AttachmentPreviewDialog>` mounted at page root
- `apps/web/src/routes/_authenticated/legal-entities/$legalEntityId/documents.tsx`
  - Adds `previewAttachment` state, clickable filename, dialog mount

---

## Task 1: Preview endpoint

**Files:**
- Create: `apps/web/src/routes/api/statement-attachments.preview.ts`

- [ ] **Step 1: Create the file with the route handler**

```ts
// apps/web/src/routes/api/statement-attachments.preview.ts
import { GetObjectCommand } from "@aws-sdk/client-s3"
import { auth } from "@prive-admin-tanstack/auth"
import { db } from "@prive-admin-tanstack/db"
import { bankStatementAttachment } from "@prive-admin-tanstack/db/schema/bank-statement-attachment"
import { createFileRoute } from "@tanstack/react-router"
import { eq } from "drizzle-orm"
import { Readable } from "node:stream"

import { bucketName, r2 } from "@/lib/r2"

export const Route = createFileRoute("/api/statement-attachments/preview")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const session = await auth.api.getSession({ headers: request.headers })
        if (!session) {
          return Response.json({ error: "Unauthorized" }, { status: 401 })
        }

        const url = new URL(request.url)
        const id = url.searchParams.get("id")
        if (!id) {
          return Response.json({ error: "Missing id" }, { status: 400 })
        }

        const row = await db.query.bankStatementAttachment.findFirst({
          where: eq(bankStatementAttachment.id, id),
        })
        if (!row) {
          return Response.json({ error: "Not found" }, { status: 404 })
        }

        let obj
        try {
          obj = await r2.send(new GetObjectCommand({ Bucket: bucketName, Key: row.r2Key }))
        } catch (error) {
          console.error("[statement-attachment preview] R2", error)
          return Response.json({ error: "Fetch failed" }, { status: 500 })
        }
        if (!obj.Body) {
          return Response.json({ error: "Empty body" }, { status: 500 })
        }

        const webStream = Readable.toWeb(obj.Body as Readable) as unknown as ReadableStream
        const filename = encodeURIComponent(row.originalName)
        return new Response(webStream, {
          headers: {
            "Content-Type": row.contentType || "application/octet-stream",
            "Content-Disposition": `inline; filename="${filename}"; filename*=UTF-8''${filename}`,
            "Cache-Control": "private, max-age=60",
          },
        })
      },
    },
  },
})
```

- [ ] **Step 2: Typecheck**

Run: `cd /Users/mselvenis/dev/prive-admin && bun run check-types`
Expected: PASS. The route may need `routeTree.gen.ts` to regenerate — if you see an error mentioning a missing route id, start `bun run dev:web` briefly (~5s) and re-run typecheck.

- [ ] **Step 3: Lint**

Run: `bun run check`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/routes/api/statement-attachments.preview.ts apps/web/src/routeTree.gen.ts
git commit -m "feat(web): /api/statement-attachments/preview streams R2 object inline"
```

- [ ] **Step 5: Manual smoke (optional, recommended)**

Start dev server (`bun run dev:web`), copy an existing attachment id from
the DB, visit `http://localhost:3000/api/statement-attachments/preview?id=<id>`
in a browser while logged in. Expect inline render of the file. Without
auth (curl with no cookie): 401 JSON.

---

## Task 2: Preview dialog component

**Files:**
- Create: `apps/web/src/components/attachment-preview-dialog.tsx`

- [ ] **Step 1: Create the component file**

```tsx
// apps/web/src/components/attachment-preview-dialog.tsx
import { Anchor, Button, Group, Modal, Stack, Text } from "@mantine/core"
import { useQuery } from "@tanstack/react-query"

export type AttachmentPreview = {
  id: string
  originalName: string
  contentType: string
}

export function AttachmentPreviewDialog({
  attachment,
  onClose,
}: {
  attachment: AttachmentPreview | null
  onClose: () => void
}) {
  const opened = attachment !== null
  const previewUrl = attachment ? `/api/statement-attachments/preview?id=${encodeURIComponent(attachment.id)}` : ""

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="xl"
      title={
        attachment && (
          <Group gap="sm">
            <Text fw={500} style={{ wordBreak: "break-all" }}>
              {attachment.originalName}
            </Text>
            <Anchor href={previewUrl} download={attachment.originalName} size="xs">
              Download
            </Anchor>
          </Group>
        )
      }
    >
      {attachment && <PreviewBody attachment={attachment} previewUrl={previewUrl} />}
    </Modal>
  )
}

function PreviewBody({ attachment, previewUrl }: { attachment: AttachmentPreview; previewUrl: string }) {
  const contentType = attachment.contentType || ""

  if (contentType === "application/pdf") {
    return <iframe title={attachment.originalName} src={previewUrl} style={{ width: "100%", height: "75vh", border: 0 }} />
  }

  if (contentType.startsWith("image/")) {
    return (
      <img
        alt={attachment.originalName}
        src={previewUrl}
        style={{ maxWidth: "100%", maxHeight: "75vh", display: "block", margin: "0 auto" }}
      />
    )
  }

  if (contentType.startsWith("text/")) {
    return <TextPreview previewUrl={previewUrl} />
  }

  return (
    <Stack gap="sm">
      <Text size="sm" c="dimmed">
        Cannot preview this file type ({contentType || "unknown"}).
      </Text>
      <Button component="a" href={previewUrl} download={attachment.originalName} variant="default">
        Download
      </Button>
    </Stack>
  )
}

function TextPreview({ previewUrl }: { previewUrl: string }) {
  const q = useQuery({
    queryKey: ["attachment-preview-text", previewUrl],
    queryFn: async () => {
      const res = await fetch(previewUrl)
      if (!res.ok) throw new Error(`Fetch failed (${res.status})`)
      return res.text()
    },
  })

  if (q.isPending) {
    return (
      <Text size="sm" c="dimmed">
        Loading…
      </Text>
    )
  }
  if (q.isError) {
    return (
      <Text size="sm" c="red">
        {(q.error as Error).message}
      </Text>
    )
  }
  return (
    <pre
      style={{
        overflow: "auto",
        maxHeight: "75vh",
        fontSize: 12,
        background: "var(--mantine-color-default)",
        padding: 12,
        borderRadius: 4,
        whiteSpace: "pre",
      }}
    >
      {q.data}
    </pre>
  )
}
```

- [ ] **Step 2: Typecheck + lint**

Run: `cd /Users/mselvenis/dev/prive-admin && bun run check-types && bun run check`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/attachment-preview-dialog.tsx
git commit -m "feat(web): AttachmentPreviewDialog component (pdf/image/text)"
```

---

## Task 3: Wire dialog into bank account detail page

**Files:**
- Modify: `apps/web/src/routes/_authenticated/legal-entities/$legalEntityId/bank-accounts/$bankAccountId.tsx`

The page uses `AttachmentsCell` inside a popover per row. The dialog state must live at `BankAccountShow` level so the popover closing does not unmount the modal. `AttachmentsCell` exposes a callback to open preview.

- [ ] **Step 1: Add the import**

Find the existing block of `@/components/...` imports near the top and add:

```ts
import { AttachmentPreviewDialog, type AttachmentPreview } from "@/components/attachment-preview-dialog"
```

- [ ] **Step 2: Add state in `BankAccountShow`**

`BankAccountShow` begins around line 73 with `function BankAccountShow({ id }: { id: string }) {`. Just below the existing `useState` declarations (look for `useState<File | null>`, `useState<StatusFilter>`, etc.), add:

```ts
const [previewAttachment, setPreviewAttachment] = useState<AttachmentPreview | null>(null)
```

`AttachmentPreview` is `{ id: string; originalName: string; contentType: string }`. Existing imports already pull `useState` from `react`.

- [ ] **Step 3: Pass an `onPreview` prop into each `AttachmentsCell` use**

Find the `<AttachmentsCell entryId={e.id} count={...} />` site (around line 321 inside the entries table row). Change to:

```tsx
<AttachmentsCell
  entryId={e.id}
  count={attachmentCountsQuery.data?.[e.id] ?? 0}
  onPreview={setPreviewAttachment}
/>
```

- [ ] **Step 4: Add the prop to the `AttachmentsCell` signature**

`AttachmentsCell` is defined around line 384 as `function AttachmentsCell({ entryId, count }: { entryId: string; count: number }) {`. Change the signature to:

```tsx
function AttachmentsCell({
  entryId,
  count,
  onPreview,
}: {
  entryId: string
  count: number
  onPreview: (a: { id: string; originalName: string; contentType: string }) => void
}) {
```

- [ ] **Step 5: Make the filename inside the popover clickable**

Inside `AttachmentsCell` the row showing each attachment renders:

```tsx
<Text size="xs" style={{ wordBreak: "break-all" }}>
  {a.originalName}
</Text>
```

Replace that `<Text>` with an `<UnstyledButton>` wrapper. Add `UnstyledButton` to the existing `@mantine/core` import block at the top of the file. Then:

```tsx
<UnstyledButton
  onClick={() => onPreview({ id: a.id, originalName: a.originalName, contentType: a.contentType })}
  style={{ textAlign: "left", flex: 1, minWidth: 0 }}
>
  <Text size="xs" td="underline" style={{ wordBreak: "break-all" }}>
    {a.originalName}
  </Text>
</UnstyledButton>
```

- [ ] **Step 6: Mount the dialog at the bottom of `BankAccountShow` return**

`BankAccountShow` currently ends with `<EditBankAccountModal ... />` followed by `</Container>`. Add the preview dialog right after the edit modal:

```tsx
<AttachmentPreviewDialog attachment={previewAttachment} onClose={() => setPreviewAttachment(null)} />
```

- [ ] **Step 7: Typecheck + lint**

Run: `cd /Users/mselvenis/dev/prive-admin && bun run check-types && bun run check`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/routes/_authenticated/legal-entities/\$legalEntityId/bank-accounts/\$bankAccountId.tsx
git commit -m "feat(web): preview dialog on bank account entry attachments"
```

---

## Task 4: Wire dialog into Documents tab

**Files:**
- Modify: `apps/web/src/routes/_authenticated/legal-entities/$legalEntityId/documents.tsx`

The Documents tab currently renders each unassigned attachment as `<Text size="sm">{a.originalName}</Text>`. Make it clickable; mount the dialog inside the same component.

- [ ] **Step 1: Add the import**

Add to the existing `@/...` import block:

```ts
import { AttachmentPreviewDialog, type AttachmentPreview } from "@/components/attachment-preview-dialog"
```

Add `UnstyledButton` to the existing `@mantine/core` import block.

- [ ] **Step 2: Add state in `DocumentsTab`**

`DocumentsTab` begins with `function DocumentsTab() {`. Below the existing `useState` calls (`busy`, `fileInputKey`), add:

```ts
const [previewAttachment, setPreviewAttachment] = useState<AttachmentPreview | null>(null)
```

- [ ] **Step 3: Make the filename clickable**

Find the `<Text size="sm" style={{ wordBreak: "break-all" }}>{a.originalName}</Text>` cell inside the rows map. Replace with:

```tsx
<UnstyledButton
  onClick={() =>
    setPreviewAttachment({ id: a.id, originalName: a.originalName, contentType: a.contentType })
  }
  style={{ textAlign: "left" }}
>
  <Text size="sm" td="underline" style={{ wordBreak: "break-all" }}>
    {a.originalName}
  </Text>
</UnstyledButton>
```

- [ ] **Step 4: Mount the dialog**

`DocumentsTab` returns a `<Card><Stack>...</Stack></Card>`. After the closing `</Stack>` and before `</Card>`, add nothing (the Modal is portal-rendered so it can sit outside the Card). Add it after the `</Card>` closing tag, inside a React fragment wrapping the existing return — wrap the existing return:

```tsx
return (
  <>
    <Card withBorder>
      {/* existing Stack and table */}
    </Card>
    <AttachmentPreviewDialog attachment={previewAttachment} onClose={() => setPreviewAttachment(null)} />
  </>
)
```

- [ ] **Step 5: Typecheck + lint**

Run: `cd /Users/mselvenis/dev/prive-admin && bun run check-types && bun run check`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/routes/_authenticated/legal-entities/\$legalEntityId/documents.tsx
git commit -m "feat(web): preview dialog on Documents tab unassigned list"
```

---

## Task 5: Manual smoke test

- [ ] **Step 1: Start dev server**

```bash
bun run dev:web
```

- [ ] **Step 2: Walk the smoke checklist**

Sign in. Navigate to a legal entity with at least one bank account that has uploaded attachments.

- Visit `/legal-entities/<id>/bank-accounts/<accId>`.
- Click an entry's attachments badge to open the popover.
- Click a PDF filename → Modal opens; iframe renders the PDF; Download link works.
- Repeat for an image attachment (jpg/png) — `<img>` renders.
- Upload a `.csv` (or pick one), click its filename — `<pre>` renders the text contents.
- Visit `/legal-entities/<id>/documents`. Click an unassigned attachment's filename — same dialog renders.
- Close dialog with the modal X — state clears, no leftover.
- (Optional) Upload a `.docx` and click it — fallback message "Cannot preview this file type (…)" with Download button.

- [ ] **Step 3: Negative auth check**

```bash
curl -i 'http://localhost:3000/api/statement-attachments/preview?id=NOPE'
```

Expected: HTTP/1.1 401 with `{"error":"Unauthorized"}` body.

With a logged-in session cookie but unknown id:

```bash
curl -i -H "Cookie: <copy from browser>" 'http://localhost:3000/api/statement-attachments/preview?id=NOPE'
```

Expected: 404 with `{"error":"Not found"}`.

- [ ] **Step 4: If anything failed, open a follow-up task, don't pile fixes here.**

- [ ] **Step 5: No commit unless fixes were applied.**

---

## Self-review checklist

Run this once after writing all tasks. Don't dispatch a subagent.

1. **Spec coverage:**
   - Preview endpoint (Spec §Architecture > Preview endpoint) → Task 1
   - Dialog component with PDF / image / text / fallback (Spec §Architecture > Dialog component) → Task 2
   - Bank-account-detail consumer wiring (Spec §Architecture > Wiring a) → Task 3
   - Documents-tab consumer wiring (Spec §Architecture > Wiring b) → Task 4
   - Error handling (Spec §Error handling): endpoint 401/404/500 — Task 1; unknown contentType — Task 2 fallback branch; text branch error — Task 2 TextPreview useQuery
   - Out-of-scope items (page nav, zoom, prev/next, office docs, CSV parsing) — confirmed not implemented
   - No schema changes — confirmed (no migration step in plan)

2. **Placeholder scan:** No "TBD" / "implement later". Each code-touching step contains full code blocks.

3. **Type consistency:** `AttachmentPreview` type is the same shape `{ id, originalName, contentType }` exported from the dialog module and used in both consumers (Task 3 step 2, Task 4 step 2). The endpoint expects query string `?id=` — both consumers use the dialog module's URL constructor that encodes the id (`encodeURIComponent`).

4. **Coverage gaps identified inline:**
   - Manual smoke checklist (Task 5) covers each renderer branch and both consumer pages, plus the negative auth/404 cases noted in the spec's error-handling section.
