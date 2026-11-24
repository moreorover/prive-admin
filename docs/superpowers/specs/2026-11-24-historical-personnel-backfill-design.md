# Historical Personnel Backfill Design

## Intent

Populate the new `personnel` table from existing appointment assignments so historical masters and assistants are recognized as personnel instead of being offered registration buttons.

## Goals

- Add one personnel profile for every customer historically used as an appointment master.
- Add assistant profiles for historical `appointment_personnel` assignments that do not already have a profile.
- Preserve the current one-personnel-profile-per-customer schema.
- Run the backfill through a normal Drizzle migration on every environment.

## Non-goals

- Do not add personnel access to the application.
- Do not change compensation or finance behavior.
- Do not introduce multiple roles per customer in this change.
- Do not overwrite existing personnel profiles.

## Conflict rule

If a customer appears as both an appointment master and assigned personnel, the migration creates or preserves a `master` profile. Master status takes precedence because the current schema allows only one profile per customer.

## Approaches

- Runtime inference was rejected because it would leave the personnel directory and finance relationships incomplete.
- A multi-role schema was rejected as broader than the immediate historical-data problem.
- A one-time SQL data migration is selected because it fits the current schema and Drizzle migration workflow.

## Implementation

Add a Drizzle-generated migration after the current migrations. It will insert master profiles from distinct `appointment.master_id` values, then insert assistant profiles from distinct `appointment_personnel.personnel_id` values only when no profile exists for that customer. New profile IDs will be generated in SQLite and timestamps will use the table defaults.

Verify the migration with a focused SQLite test covering masters, assistants, master precedence, existing profiles, duplicate assignments, and empty assignment tables, followed by the full project checks.
