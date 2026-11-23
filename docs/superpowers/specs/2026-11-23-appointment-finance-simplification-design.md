# Appointment finance simplification

## Intent

Keep appointment finance aligned with the business’s current model: each
transaction already stores a signed amount, appointment, and customer. Finance
reports should calculate totals from those fields without adding a second
transaction classification system.

## Scope

- Remove `movement_type` from the appointment-finance implementation and its
  compatibility/backfill logic.
- Calculate appointment totals by summing signed transaction amounts.
- Calculate customer and personnel totals by matching transaction customer IDs
  to the appointment client, master, and assigned personnel.
- Retain personnel role data only where it is needed to manage and validate
  appointment assignments.

## Non-goals

- Salary, percentage, refund, adjustment, or compensation rules.
- Personnel authentication or user-account linking.
- Inferring business meaning beyond the stored signed amount and appointment
  relationships.

## Data behavior

The report preserves transaction signs. The UI may label a negative personnel
sum as paid/outflow, but the database value remains unchanged. Transactions
without an appointment remain outside appointment finance reports.

## Approaches

1. Keep `movement_type` and infer it from amount signs. Rejected because it
   duplicates information already present in signed amounts.
2. Remove `movement_type` and aggregate signed transactions by appointment and
   relationship. Chosen because it is the smallest model that supports the
   current business requirements.
3. Add a separate financial-allocation ledger. Deferred until compensation
   rules or audit requirements justify the additional state.
