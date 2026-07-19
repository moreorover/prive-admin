# Assigned Legal Entity Documents Design

## Context

The legal entity Documents route currently shows only unassigned bank statement attachments. Users can upload documents, preview them, assign them to pending bank statement entries, and delete unassigned files. Once a document is assigned, it disappears from this route even though users may need to audit prior matches or correct an incorrect assignment.

Unassigned documents are global because they are not connected to a legal entity yet. Assigned documents should be scoped to the current legal entity through the matched bank statement entry's bank account.

## Goals

- Show assigned documents from the current legal entity's bank accounts.
- Keep unassigned documents visible as the default work queue.
- Use one Documents page with a compact status control.
- Show enough matched-entry context to audit the assignment.
- Allow assigned documents to be unassigned for correction.

## Non-Goals

- Do not make unassigned documents entity-scoped.
- Do not add deleting assigned documents in this feature.
- Do not change upload behavior.
- Do not redesign bank statement entry matching.
- Do not add broad document search unless needed later.

## User Experience

`/legal-entities/$legalEntityId/documents` should remain the document work area. Add a compact status control above the table:

- `Unassigned`: default view, global queue, existing upload and assign behavior.
- `Assigned`: current legal entity only, showing documents already matched to bank statement entries.

The route should feel like one document list whose columns and actions adapt to the selected status. Unassigned remains task-first. Assigned becomes an audit and correction view for the current legal entity.

## Assigned Documents Table

The assigned view should show a paginated table with:

- File name, opening the existing attachment preview dialog.
- Uploaded date.
- Matched bank entry date.
- Signed amount with currency.
- Counterparty name.
- Bank account display name, with bank name when available.
- Entry status.
- `Unassign` action.

The empty state should say `No assigned documents for this legal entity.`

## Unassigned Documents Table

The unassigned view should keep the current behavior:

- Global unassigned document query.
- Upload action.
- Pending-entry pagination.
- Assignment select.
- File preview.
- Delete action.

The UI must not imply unassigned documents belong to the current legal entity.

## Data/API

Keep `bankStatementAttachments.list({ assigned: false })` for the unassigned queue.

Add a focused assigned-documents query, likely `bankStatementAttachments.listAssigned`, accepting:

- `legalEntityId`
- `page`
- `pageSize`

The repository query should join:

- `bank_statement_attachment`
- `bank_statement_entry`
- `bank_account`

It should filter to attachments with a non-null `bankStatementEntryId` and bank accounts whose `legalEntityId` matches the current route.

The returned row should include:

- Attachment: id, original name, content type, uploaded date.
- Entry: id, date, amount, currency, direction, counterparty name, status.
- Bank account: id, display name, bank name, currency.

Return a paged result so the assigned list can scale without loading all historical documents.

## Corrections

The assigned view should include `Unassign`. On success:

- Invalidate assigned document queries.
- Invalidate unassigned document queries.
- Invalidate attachment counts if needed.
- Keep the UI on the assigned view.
- If the current assigned page becomes empty after unassigning, clamp to the last available page or page 1.

On failure, keep the row in place and show the existing red notification pattern.

## Error Handling

- If assigned documents fail to load, show an inline assigned-view error only.
- If unassigned documents fail to load, preserve the current route shell and show an inline unassigned-view error.
- Upload/assign/unassign/delete failures should use existing notification patterns.

## Verification

- Add repository/service/router coverage for the assigned list filtering by legal entity and returning entry/bank-account context.
- Add frontend tests only if a practical route/component pattern exists; otherwise rely on type checks and browser validation.
- Run `vp check`.
- Run web type-checking.
- Run focused new backend tests.
- Run `vp test` and document the known full-suite discovery failure if it still occurs.
- Browser-validate both status modes, unassign behavior, and current-entity scoping.
