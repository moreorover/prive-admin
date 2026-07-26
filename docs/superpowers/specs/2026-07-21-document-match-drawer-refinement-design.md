# Document Match Drawer Refinement Design

## Context

The document match drawer replaced the unclear inline assignment select, but the first drawer version still reads like a long transaction list. It renders many bank entries at once, row boundaries are weak, and one generic search field does not match how users reason about reconciliation.

## Goals

- Make candidate pagination visible inside the drawer.
- Make each candidate transaction boundary clear.
- Replace the single candidate search with separate client-side filters.
- Preserve the existing `Match document` assignment flow.
- Keep filtering client-side over the currently loaded candidate page.

## Non-Goals

- Do not add backend filtering in this refinement.
- Do not change the candidate page size of 100.
- Do not change assignment, upload, preview, unassign, or delete behavior.

## User Experience

The drawer should show structured filters above the candidates:

- `Legal entity` select.
- `Bank account` select, narrowed by the selected legal entity.
- `Counterparty` text input.
- `Date` text input.
- `Amount` text input.

The candidate list should render as bounded candidate cards instead of loose stacked rows. Each card should have a visible border, a compact status badge, and predictable zones:

- Legal entity and entry status at the top.
- Bank account and bank name under the legal entity.
- Date and signed amount as prominent facts.
- Counterparty below the facts.
- `Match document` action aligned consistently.

The drawer should show a count such as `2 of 100 shown` and keep pagination visible below the candidate list when more than one candidate page exists.

## Data And API

Use the existing `bankStatementEntries.listMatchCandidates` query and keep requesting 100 candidates per page. Filter state remains local to the drawer. The bank account filter options should derive from candidates that match the selected legal entity.

## Error Handling

- If filters remove all candidates on the current page, show `No candidates match these filters.`
- If there are no candidates before filtering, show `No pending entries on this page.`
- Existing candidate load and assignment errors remain unchanged.

## Verification

- Add a unit test for the client-side filtering helper.
- Run focused tests for the new helper and candidate API.
- Run `vp check`.
- Run `vp test`.
- Browser-validate that filters are separate, candidate cards have clear boundaries, pagination stays visible, and the drawer no longer shows `Pick entry...`.
