# Customer appointment role history

## Intent

The customer detail page's Appointments tab must show every appointment in which the selected customer participates as the client, the master, or assigned personnel. This gives users one complete appointment history for that customer.

## Goals

- Include appointments matching `appointment.clientId` or `appointment.masterId`.
- Include appointments with a matching `personnel_on_appointments.personnel_id`.
- Return each appointment once, even if the customer matches more than one role.
- Show the customer's assignment in a `Role` column as `Client`, `Master`, or `Personnel`.
- Preserve the existing name search, newest-first ordering, pagination, and route/API shape.
- Keep server reads owned by the route owner and the application service/API layers.

## Non-goals

- No role filter UI; the requested behavior is a unified “any role” history.
- No changes to appointment creation, editing, personnel assignment, or calendar behavior.
- No changes to the general appointments list.

## Approach

The customer-scoped repository query will replace its client-only predicate with an OR predicate covering client, master, and personnel membership. The personnel condition will use an `EXISTS` subquery rather than joining the collection, so pagination and counts remain one row per appointment. The list response will include the existing client/master data plus personnel data needed by the route owner to derive the customer's singular role label. The application service and tRPC procedure will keep their existing contracts. Regression tests will cover the repository predicate shape and service/API forwarding where appropriate.

## Constraints and implementation calls

- Keep `customers.appointments.list` as the stable resource-oriented procedure.
- Continue searching appointment names only.
- Keep the existing newest-first ordering.
- Use the existing `personnelOnAppointments` schema/table and Drizzle SQL helpers.
- Treat role assignment as singular in the UI (`Client`, `Master`, or `Personnel`), matching the product's business rule; query deduplication remains defensive.
