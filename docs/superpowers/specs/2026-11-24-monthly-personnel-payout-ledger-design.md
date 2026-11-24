# Monthly Personnel Payout Ledger Design

## Intent

Make appointment finance answer the owner’s primary question directly: how much was paid to each master and assistant during a selected month.

## Goals

- Select a year, month, and currency without scanning all months.
- Show one row per master or assistant for the selected month.
- Show role, appointment count, paid total, and any positive credit/adjustment.
- Present negative personnel transactions as positive payout amounts.
- Preserve the existing signed transaction source of truth.

## Non-goals

- No salary, percentage, or compensation rules.
- No new financial ledger tables.
- No change to transaction creation or appointment assignment behavior.
- No personnel access or authentication changes.

## Approaches

- Keep the current two-table layout: rejected because it mixes customer receipts with personnel payouts and requires manual interpretation.
- Annual personnel matrix: rejected for the first version because it is too wide and less useful for checking one month.
- Monthly payout ledger: selected because it maps directly to the owner’s recurring monthly question and can reuse the existing personnel finance query.

## Calculation and presentation

For each personnel/customer and currency in the selected month:

- `Paid` = absolute value of the sum of negative personnel-linked transactions.
- `Credits / adjustments` = sum of positive personnel-linked transactions.
- Personnel-linked transactions are those assigned to the appointment master or appointment personnel.
- The table includes the personnel role from the personnel profile and the number of distinct appointments represented by the transactions.

The page will default to the current year and month, with compact month/year controls, a clear paid total summary, and a readable payout table. The existing monthly net-total section is removed from the primary view because it does not answer the owner’s payout question.

## Constraints

- Use the existing application service and tRPC report resource; route owners remain responsible for queries and mutations.
- Keep signed transactions as the source of truth.
- Maintain currency separation; do not combine EUR, GBP, or other currencies.
- Verify the query and UI with focused tests plus the full project checks.
