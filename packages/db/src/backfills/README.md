# Appointment finance compatibility backfill

Run against an existing **local SQLite copy** with the repository migrations
applied through `0007_married_star_brand.sql`. This tool does not connect to D1,
read environment credentials, import data, or change the migration journal.
Use the existing database-copy workflow to obtain a consistent copy first.

From the repository root:

```sh
vp exec tsx packages/db/src/backfills/appointment-finance.ts /absolute/path/copy.sqlite > /tmp/finance-dry-run.json
vp exec tsx packages/db/src/backfills/appointment-finance.ts /absolute/path/copy.sqlite --apply > /tmp/finance-apply.json
```

The first command opens the file read-only and makes no updates. `--apply`
explicitly enables writes to that file. Missing paths and unknown arguments
fail with a nonzero exit code. Neither command creates a new database.
No remote write/import step is provided; review and backup are necessary before
using any copy as a replacement for live data.

## Compatibility decisions

- Migration 0007 supplies `legacy_unclassified` for all historical rows. The
  explicit `appointment-finance.sql` backfill is used by preview seeding and
  this tool. Normal schema migrations do not infer historical financial meaning.
  An absent movement column is an error: run migrations normally, rather than
  executing the ALTER outside the migration journal.
- For a drifted schema that permits NULL/empty movement types, apply changes
  first repairs those values to `legacy_unclassified`, then classifies only
  unambiguous appointment-linked rows as `received` or `personnel_allocation`.
  Existing explicit types, unknown nonempty values, signs, currencies,
  timestamps, amounts, IDs, customer, order and appointment references remain
  intact. Unknown values are reported for review, including whitespace-only
  values; they are not normalized.
- Every row is included, including transactions without an appointment/customer,
  zero/negative amounts, unknown currencies, and historical inactive personnel.
  Amounts must be SQLite integers in minor units. Other storage types fail
  verification rather than being coerced. Currency strings remain distinct.
- `appointment.master_id` and `appointment_personnel.personnel_id` reference
  customers in the current schema. Missing personnel profiles are created from
  those explicit assignments, with master taking precedence when a customer is
  assigned in both roles. Existing profile IDs, types, activation states, and
  salon scopes are preserved. Client IDs and transaction customer IDs alone
  never establish personnel status.
- Only a positive transaction from the appointment client is classified as
  `received`, and only a negative transaction for the appointment master or an
  assigned assistant is classified as `personnel_allocation`. Ambiguous,
  incorrectly signed, unlinked, and zero-value rows remain
  `legacy_unclassified` for review. Existing explicit and unknown movement types
  are preserved.

## Report and safeguards

JSON contains the mode, before/after counts and exact signed minor-unit sums per
currency (decimal strings), `pending` missing classifications at the start,
`changes` actually updated, `legacyCount` (including missing values proposed as
legacy in dry-run), unknown movement types, personnel candidates and
`idsPreserved`. A rerun after apply has zero pending rows and zero changes.
Dry-run reports the actual unchanged before/after financial totals.

Each invocation owns one transaction; apply uses `BEGIN IMMEDIATE` to exclude
concurrent writers. It streams transactions ordered by ID twice, uses BigInt
addition (no SQLite SUM overflow or JS rounding), and verifies SHA-256 digests
of IDs, every non-movement field, and expected classifications before commit.
Unexpected trigger changes to financial rows/classifications cause rollback.
Nested transactions are refused. Dry-run closes its read transaction with
rollback. Failed runs exit without committing updates.

Runtime is linear in transaction rows apart from ordering; memory tracks
currencies and personnel candidates, not the whole transaction table. Apply
holds a SQLite write lock for the scan/verification interval. Candidate output
contains customer/profile IDs and should be handled as internal data.

No production database has been inspected as part of Task 7. Fixture results
prove behavior, not the state of any deployed database. Run the read-only
command on an actual consistent migrated copy to discover data-dependent
candidate counts, orphan references, unknown types, or invalid amount storage.
