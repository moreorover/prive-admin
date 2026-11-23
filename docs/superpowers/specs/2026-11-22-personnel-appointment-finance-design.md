# Personnel, Appointment, and Finance MVP Design

## Intent

Allow the owner to distinguish ordinary paying customers from masters and other personnel, assign only eligible personnel to appointments, and understand appointment money received, personnel allocations, and the owner remainder.

Personnel are internal business records in this phase. They do not receive application accounts or login access.

## Goals

- Add an explicit personnel capability/profile without breaking existing customer and appointment IDs.
- Restrict master and supporting-personnel selection to active personnel.
- Preserve the existing appointment transaction model as the financial source of truth for this MVP.
- Make transaction meaning explicit enough to distinguish received money, personnel allocations, refunds, and adjustments.
- Provide owner reporting per appointment, per month, and per personnel member.
- Preserve historical records when a customer/personnel status changes.

## Non-goals

- Personnel login access or self-service workflows.
- Percentage commissions, salary rules, compensation policies, payroll, or tax calculations.
- A separate accounting ledger, payment-allocation system, or FX conversion system.
- Full profit accounting, including operating expenses, taxes, or owner distributions.

## Anti-goals

- Do not infer personnel eligibility from a customer name or from Better Auth roles.
- Do not silently reinterpret existing transaction rows as payroll, payouts, or formal accounting entries.
- Do not combine EUR and GBP totals.
- Do not automatically split money equally between masters and assistants.

## Current constraints

- `customer` is currently the only business-person table.
- Appointment clients, masters, and supporting personnel all reference `customer.id`.
- The current appointment transaction contains amount, currency, customer, appointment, order, and free-text fields, but no explicit movement type.
- The current application is effectively owner-only; server procedures generally require a session but do not yet implement personnel-specific access.

## Approaches considered

### 1. Add role flags directly to `customer`

This is the smallest migration and keeps all existing foreign keys, but it overloads the customer record with personnel-specific state and will become difficult to extend.

### 2. Add a personnel profile linked to `customer` — selected

Create a dedicated personnel profile keyed by the existing customer ID. This keeps the migration small, makes appointment eligibility explicit, and leaves room for personnel-specific fields such as type and active status without changing the meaning of customer data.

### 3. Replace customer with a canonical person/profile model

This is the cleanest long-term model, but it requires broad foreign-key and UI migration that is not justified for the current MVP.

The selected approach is the dedicated personnel profile because it fixes the immediate eligibility problem while preserving existing data and avoiding unnecessary account or payroll features.

## Proposed domain model

Add a `personnel` table with a one-to-one relationship to `customer`:

- `id`
- `customerId` (unique foreign key)
- `type` or role, initially supporting `master` and `assistant`
- `active`
- optional `salonId` or scope if the existing business requires salon-specific eligibility
- timestamps

The existing appointment fields remain during the compatibility phase:

- `clientId` continues to identify the paying customer.
- `masterId` continues to identify the lead master, but must reference an active personnel profile in application-service validation.
- `appointment_personnel` continues to identify supporting personnel, but links must validate active personnel eligibility.

The UI must load masters and personnel from personnel-specific queries rather than the unrestricted customer list.

Existing customer records referenced as masters or supporting personnel must be reviewed or backfilled into `personnel`. Inactive personnel remain valid historical references.

## Transaction model

Keep the current `transaction` table as the source of truth for MVP appointment money movements. Add an explicit movement type, for example:

- `received` — money received for the appointment;
- `personnel_allocation` — money allocated or paid to a master/personnel member;
- `refund` — money returned to the customer;
- `adjustment` — a correction to a prior movement.

Each movement remains a separate row with its appointment, amount, currency, and counterparty/customer reference. Use signed minor units consistently; the application should enforce the sign convention and transaction-type rules. A personnel allocation must target assigned personnel for that appointment.

Example:

```text
received:              +100 EUR
master allocation:      -60 EUR
assistant allocation:   -10 EUR
owner remainder:         30 EUR
```

The owner remainder is calculated, not stored as another transaction:

`received - refunds + adjustments - personnel allocations`

Existing rows must not be automatically reclassified without evidence. Historical rows whose meaning is ambiguous should remain visible as legacy/unclassified data until reviewed.

## Reporting

Owner reports should support:

- appointment detail: received, refunds, adjustments, personnel allocations, and owner remainder;
- monthly totals, separated by currency;
- personnel earnings/allocation totals by month;
- outstanding amount owed to each personnel member, defined as allocated amount minus recorded payments if the business records allocations and actual payments separately;
- a clear distinction between confirmed and unresolved historical movements.

For the first MVP, if an allocation row represents both the amount owed and the amount paid, report it as an allocation. Do not claim a separate outstanding balance until the business records those concepts separately.

Reports should use the transaction date for transaction movement totals and appointment start date for appointment grouping when required by the existing UI. The date semantics must be labeled clearly; do not call a transaction date a payment date unless the data actually records payment timing.

## Application and API changes

Model backend behavior in `packages/application/src/services` first.

Recommended capabilities include:

- `listPersonnel`
- `createPersonnel`
- `updatePersonnel`
- `listAppointmentTransactions`
- transaction creation/update validation by movement type
- owner reporting service for appointment and monthly summaries

Use resource-oriented tRPC procedures as transport adapters. Do not add procedures named after pages or UI components.

Appointment creation and update services must validate personnel eligibility. Transaction services must validate that personnel allocations target the appointment master or assigned personnel.

## Migration plan

1. Add the personnel profile table and backfill known masters/personnel from appointment references.
2. Add personnel-specific list queries and update appointment selectors.
3. Add transaction movement type with a safe compatibility default for existing rows.
4. Preserve existing transaction rows and expose any ambiguous rows as legacy/unclassified.
5. Add owner reporting services and UI based on typed transaction movements.
6. Add tests for eligibility, transaction validation, monthly aggregation, currency separation, and historical status changes.

Do not add personnel authentication, compensation policies, or a separate financial ledger in this phase.

## Acceptance criteria

- A normal customer cannot be selected as a master or supporting personnel unless they have an active personnel profile.
- A personnel profile may exist without a login account.
- A person may be both a customer and personnel.
- Historical appointments remain readable when personnel are deactivated.
- A personnel allocation cannot be recorded for an unrelated person.
- Reports show received money, personnel allocations, refunds/adjustments, and owner remainder per appointment and month.
- EUR and GBP totals remain separate.
- Existing transaction data is preserved and ambiguous historical rows are not presented as certain allocations.
- All relevant validation is enforced through application services/API, not only in the UI.

## Builder decisions still required

- Confirm the exact sign convention for existing transaction amounts before migration.
- Confirm whether a personnel allocation currently means money paid immediately or money owed/allocated.
- Confirm whether appointment start date or transaction creation date should be the default monthly grouping date.
- Confirm whether personnel types need more than `master` and `assistant` in the first release.
