# Global Documents Page Design

## Context

Document management currently lives under `/legal-entities/$legalEntityId/documents`. That page supports a global unassigned upload queue and an assigned audit view scoped to the selected legal entity. Users need a dedicated global place to find uploaded documents without first knowing which legal entity, bank account, or statement entry they belong to.

Assigned documents can be linked back to a legal entity through the matched bank statement entry's bank account. Unassigned documents have no legal entity yet and must remain clearly global.

## Goals

- Add a top-level documents page for finding every uploaded document.
- Show assigned and unassigned documents from one global work area.
- Show the legal entity for assigned documents.
- Keep upload, preview, assign, unassign, and unassigned-delete workflows available from the global page.
- Preserve the existing legal-entity documents page behavior.

## Non-Goals

- Do not make unassigned documents legal-entity scoped.
- Do not delete assigned documents from this feature.
- Do not change the upload endpoint or storage behavior.
- Do not redesign bank statement matching.
- Do not remove the legal-entity documents tab.

## User Experience

Add `/documents` as a top-level authenticated route and main navigation item labeled `Documents`. The existing unassigned document badge should appear on this nav item so the work queue is visible without opening Legal entities.

The page should use the existing admin layout patterns: `Container`, `PageHeader`, `Section`, `Table`, compact filters, and icon actions. It should feel like an operational register, not a marketing page.

The page has a compact status control:

- `Unassigned`: all uploaded documents not matched to a bank statement entry.
- `Assigned`: all uploaded documents matched to entries across all legal entities.
- `All`: both assigned and unassigned documents in one audit table.

Default to `Unassigned` so the first view is the actionable queue.

## Table Behavior

The global table should show:

- File name, opening the existing attachment preview dialog.
- Uploaded date.
- Assignment state.
- Legal entity for assigned rows.
- Bank account for assigned rows.
- Matched entry date and signed amount for assigned rows.
- Counterparty for assigned rows.
- Entry status for assigned rows.
- Row actions.

Unassigned rows should show empty assignment context, not an implied legal entity. They should allow:

- Preview.
- Assign to a pending bank statement entry.
- Delete.

Assigned rows should allow:

- Preview.
- Unassign.

Deleting assigned documents remains unavailable.

## Data And API

Keep the existing unassigned attachment list behavior available for current consumers.

Add a paginated global document listing query, exposed through the bank statement attachments API. Input:

- `status`: `assigned`, `unassigned`, or `all`.
- `page`.
- `pageSize`.

For assigned rows, the repository should join:

- `bank_statement_attachment`.
- `bank_statement_entry`.
- `bank_account`.
- `legal_entity`.

The returned row should include:

- Attachment: id, original name, content type, uploaded date.
- Assignment state.
- Entry: id, date, amount, currency, direction, counterparty name, status.
- Bank account: id, display name, bank name, currency.
- Legal entity: id, name.

For unassigned rows, entry, bank account, and legal entity context should be `null`.

The repository should support status filtering and stable pagination. The existing legal-entity documents tab may keep using its current scoped query; this feature does not require consolidating the two query paths.

## Navigation

Add `Documents` to the main authenticated navigation. Use the same unassigned badge source currently used for Legal entities. If the badge remains on Legal entities too, the duplicate signal is acceptable during this feature, but the preferred end state is that the document queue badge belongs to `Documents`.

## Error Handling

- If the global list fails to load, show an inline error inside the section.
- Upload, assign, unassign, and delete failures should use the existing red notification pattern.
- Successful upload, assign, unassign, and delete mutations should invalidate the global document list, legal-entity assigned document lists, unassigned attachment lists, and attachment counts.
- If a mutation empties the current page, clamp pagination to the last available page or page 1.

## Testing And Verification

- Add repository tests for global status filtering, assigned legal entity context, unassigned null context, and pagination.
- Add service tests for forwarding status and pagination input.
- Add router tests for validation and paged response shape.
- Add frontend tests only if a practical route or component test pattern exists.
- Run `vp check`.
- Run focused new tests.
- Run `vp test`.
- Browser-validate `/documents` for unassigned, assigned, and all modes, including preview, assign, unassign, and delete.
