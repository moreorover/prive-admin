# Document preview dialog — design

Date: 2026-05-11
Status: Approved (design)
Branch: feat/multi-legal-entity

## Goal

Bank statement attachments stored in Cloudflare R2 (PDFs, images, CSVs)
currently can be uploaded, assigned, unassigned and deleted, but the
user cannot view content without downloading. Add an in-app preview
dialog that opens when the user clicks an attachment filename.

## Scope

- **Filetypes supported inline:** `application/pdf`, `image/*`, `text/*`
  (including `text/csv`).
- **Unsupported filetypes:** dialog renders a fallback message with a
  Download button (uses the same endpoint URL).
- **Size cap:** existing 25 MB upload limit is the implicit preview
  cap. No additional guard.
- **No schema changes.** Reads `bank_statement_attachment.contentType`,
  `originalName`, `r2Key`.
- **No client-side R2 fetching.** Streaming goes through the server,
  matching the existing `statement-attachments.export.ts` pattern.

## Architecture

### Preview endpoint

New TanStack file route:
`apps/web/src/routes/api/statement-attachments.preview.ts`

```
GET /api/statement-attachments/preview?id=<attachmentId>
```

Behavior:

1. `auth.api.getSession({ headers })` — 401 if missing.
2. Look up `bankStatementAttachment` row by id; 404 if absent.
3. Fetch the R2 object via `GetObjectCommand({ Bucket, Key: row.r2Key })`.
4. Stream the body to the response. Headers:
   - `Content-Type: <row.contentType>`
   - `Content-Disposition: inline; filename="<encoded originalName>"`
   - `Cache-Control: private, max-age=60`
5. R2 fetch errors → 500.

Query-string id is used (not `/$id` path segment) to avoid TanStack
file-route filename collisions with `$param` style files in this
directory.

### Dialog component

New file: `apps/web/src/components/attachment-preview-dialog.tsx`

```ts
type Attachment = { id: string; originalName: string; contentType: string }
type Props = { attachment: Attachment | null; onClose: () => void }
```

`opened` is derived from `attachment !== null`. Mantine `Modal`, size
`"xl"`. Header shows filename and a Download anchor pointing to the
same `?id=...` URL with `download={originalName}`.

Renderer dispatch on `attachment.contentType`:

| Prefix | Renderer |
|--|--|
| `application/pdf` | `<iframe src={previewUrl} style={{ width: "100%", height: "75vh", border: 0 }} />` |
| `image/` | `<img src={previewUrl} style={{ maxWidth: "100%", maxHeight: "75vh" }} />` |
| `text/` | `useQuery` to fetch via `fetch(previewUrl).then(r => r.text())`; render `<pre style={{ overflow: "auto", maxHeight: "75vh" }}>` |
| else | "Cannot preview this file type ({contentType}). [Download]" with link to the same URL |

`previewUrl = `/api/statement-attachments/preview?id=${attachment.id}``.

### Wiring (consumers)

Two callers add the same trigger pattern.

**a) `AttachmentsCell` inside `legal-entities/$legalEntityId/bank-accounts/$bankAccountId.tsx`**

State lifted to the surrounding component (`BankAccountShow`) so the
dialog is not unmounted when the popover closes. Filename in each row
becomes a clickable `<UnstyledButton>` that calls `setPreviewAttachment(a)`.

**b) `DocumentsTab` (`legal-entities/$legalEntityId/documents.tsx`)**

Same pattern: state at the tab component level, filename becomes
clickable, single `<AttachmentPreviewDialog>` rendered after the table.

Both consumers reuse the same component file.

## Data flow

```
[ filename click ]
        │
        ▼
[ state holds { id, originalName, contentType } ]
        │
        ▼
[ <AttachmentPreviewDialog> mounts with `previewUrl` ]
        │
        ▼ (image / iframe)              ▼ (text/*)
[ browser fetches preview URL ]   [ useQuery -> fetch -> pre ]
        │                               │
        ▼                               ▼
   server proxy ────► R2 GetObject ────►
```

## Error handling

| Case | Behavior |
|--|--|
| Endpoint 401 | iframe / img renders broken. No retry. Rare; user is already authed to view the page. |
| Endpoint 404 | iframe / img renders broken. Rare race after deletion. |
| R2 fetch failure (5xx) | iframe / img renders broken. Text branch surfaces React Query error message. |
| Unknown contentType | Fallback message + Download link. |
| Empty contentType (legacy) | Treated as unknown → fallback. |
| File too large | Constrained by 25 MB upload cap; no additional check. |

## Testing

`apps/web` has no Vitest setup. Verification is mechanical + manual:

- `bun run check-types`
- `bun run check`
- Manual smoke (`bun run dev:web`):
  - Click filename in `AttachmentsCell` popover → PDF renders, image
    renders, CSV renders as text.
  - Unknown filetype shows fallback with Download link.
  - Documents tab filename click opens same dialog.
  - Download anchor in header downloads the original file.
  - Unauthenticated curl: `curl -i /api/statement-attachments/preview?id=...`
    returns 401.

## Out of scope

- Page navigation / zoom / pan controls inside the dialog (browser PDF
  viewer is sufficient).
- Prev/next navigation across other attachments.
- Office document preview (.docx, .xlsx).
- CSV → table parsing.
- R2 CORS configuration (no client-direct fetch).
- Schema or migration changes.
