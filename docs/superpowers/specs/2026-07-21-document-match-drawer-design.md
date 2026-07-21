# Document Match Drawer Design

## Context

The global Documents page currently lets users assign an unassigned document with an inline `Pick entry...` select. That control is too compact for the importance of the action. A selected entry determines the legal entity, bank account, amount, counterparty, and document assignment state, but the user only sees a short option label at the moment of choice.

## Goals

- Make document-to-entry matching deliberate and auditable.
- Show the document and candidate bank entries together before assignment.
- Make legal entity and bank account context visible before matching.
- Keep the global Documents table scan-friendly.
- Reuse the existing assignment mutation and invalidation behavior.

## Non-Goals

- Do not redesign bank statement import or matching logic.
- Do not add automated matching suggestions.
- Do not change upload, preview, unassign, or delete behavior.
- Do not remove the legal-entity Documents tab.

## User Experience

Replace the inline assignment select on unassigned rows with a `Match` button. Clicking `Match` opens a drawer focused on one document.

The drawer should show:

- Document filename.
- Uploaded timestamp.
- A preview action for the document.
- Candidate pending bank entries.
- Client-side search across the currently loaded candidate entries by legal entity, bank account, counterparty, amount, and date.
- A clear `Match document` action on each candidate entry.

Candidate entry rows should show:

- Legal entity name.
- Bank account display name and bank name.
- Entry date.
- Signed amount with currency.
- Counterparty name.
- Entry status.

The final action name is `Match document`. A successful match closes the drawer, shows the existing green notification pattern, and invalidates the same document and attachment queries as the current assign flow.

## Visual Direction

The page stays operational and restrained. The distinctive design element is the drawer structure: document identity on one side, candidate ledger entries on the other. The drawer should feel like reconciliation, not a generic picker.

Use the existing Mantine and app theme components. Do not introduce a new visual system. Use button/icon language consistently with the rest of the app.

## Data And API

The drawer needs candidate bank entries with legal entity context. Add a focused list query for pending match candidates that returns:

- Entry: id, date, amount, currency, direction, counterparty name, status.
- Bank account: id, display name, bank name.
- Legal entity: id, name.

Load 100 candidates per page. Search is client-side over the currently loaded page so this feature does not expand into backend search.

## Error Handling

- If candidates fail to load, show an inline drawer error.
- If matching fails, keep the drawer open and show a red notification.
- If the document gets matched or deleted elsewhere, the assignment mutation should surface the existing API error and leave the page consistent after invalidation.

## Testing And Verification

- Add tests for any new repository/service/router candidate query.
- Add frontend tests only if an existing practical route/component pattern exists.
- Run focused backend tests.
- Run `vp check`.
- Run `vp test`.
- Browser-validate that `Match` opens the drawer, candidate rows show legal entity context, preview still opens, and `Match document` assigns a document.
