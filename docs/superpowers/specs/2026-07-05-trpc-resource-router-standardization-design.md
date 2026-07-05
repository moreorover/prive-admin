# tRPC Resource Router Standardization Design

## Context

The server app is a Hono Node server that mounts Better Auth under `/api/auth/*`, file-oriented REST endpoints under `/api/*`, and tRPC under `/trpc/*`.

JSON business operations live in `packages/api/src/routers/*`. The routers were migrated from TanStack Start server functions and currently preserve several action-oriented names:

- `customers.byId`
- `appointments.byCustomerId`
- `transactions.byAppointmentId`
- `hairAssigned.byCustomer`
- `hairAssigned.byAppointment`
- `bankStatementAttachments.unassigned`

Some routers already follow a stronger collection shape. `cashTransactions.list` accepts pagination and filters and returns `{ items, page, pageSize, totalCount }`. Other routers, such as `customers.list`, return all rows with no input.

This design standardizes the existing tRPC surface so the API behaves like resource-oriented REST while keeping tRPC as the typed transport.

## Goals

- Keep tRPC routers and procedures as the JSON business API.
- Standardize all existing tRPC procedures around resource-oriented naming and contracts.
- Update all web call sites in the same PR.
- Make collection reads consistently filterable and pageable where the resource can grow.
- Use one page response envelope for paged collection responses.
- Keep domain actions explicit when they do not map cleanly to CRUD.
- Keep Hono REST endpoints for auth, multipart uploads, binary previews, and exports.

## Non-Goals

- Do not add missing operations just to complete a CRUD matrix.
- Do not replace tRPC with HTTP JSON REST endpoints.
- Do not redesign the database schema or domain model.
- Do not redesign the web UI.
- Do not migrate file upload, preview, or export flows into tRPC.
- Do not add compatibility aliases for renamed tRPC procedures.

## Recommended Approach

Use resource-oriented tRPC routers with a small canonical procedure vocabulary:

- `list`: collection reads.
- `get`: single-resource reads by `{ id }`.
- `create`: create an existing resource type when that operation already exists.
- `update`: update an existing resource type when that operation already exists.
- `delete`: delete an existing resource type when that operation already exists.

Existing non-CRUD operations remain explicit domain procedures when they represent workflow commands, aggregate reads, imports, exports, or analytical views. Examples include `summary`, `stats`, `import`, `assign`, `unassign`, `ignore`, `undo`, and `recalculatePrices`.

This is a breaking internal API refactor. Procedure names and inputs can change, and all affected web call sites must be updated in the same PR.

## Procedure Naming Rules

Single-resource reads should use `get`:

- `customers.byId` becomes `customers.get`.
- `appointments.byId` becomes `appointments.get`.
- `legalEntities.byId` becomes `legalEntities.get`.
- `salons.byId` becomes `salons.get`.
- `bankAccounts.byId` becomes `bankAccounts.get`.

Collection reads should use `list` with filters instead of relationship-specific procedure names:

- `appointments.byCustomerId` becomes `appointments.list({ customerId })`.
- `transactions.byAppointmentId` becomes `transactions.list({ appointmentId })`.
- `hairAssigned.byCustomer` becomes `hairAssigned.list({ customerId })`.
- `hairAssigned.byAppointment` becomes `hairAssigned.list({ appointmentId })`.
- `bankStatementAttachments.unassigned` becomes `bankStatementAttachments.list({ assigned: false })`.

Existing action procedures should keep verb names only when they are true domain actions:

- `appointments.linkPersonnel` remains a domain action because there is no standalone appointment-personnel resource in the existing API.
- `appointments.updateMaster` becomes `appointments.update` with the same effective capability: updating the appointment master. This standardizes the resource update name without adding unrelated appointment update fields.
- `bankStatementEntries.importCsv` remains `importCsv` because the input format is part of the operation contract.
- `bankStatementEntries.ignore` and `bankStatementEntries.undo` remain workflow actions.
- `bankStatementAttachments.assign` and `bankStatementAttachments.unassign` remain workflow actions.
- `hairOrders.recalculatePrices` remains a domain action.

Analytical routers can use descriptive names, but they should be consistent within each router. Dashboard and reports procedures do not need to pretend to be CRUD resources.

## List Contract

Every collection procedure should accept an object input, even if it has no required filters today. This gives a stable place to add pagination, search, sort, and filters without changing procedure shape again.

The common list input fields are:

```ts
{
  page?: number
  pageSize?: number
  search?: string
}
```

Resource-specific filters live beside those fields:

```ts
customers.list({
  page,
  pageSize,
  search,
  phoneNumber,
})
```

```ts
appointments.list({
  page,
  pageSize,
  startDate,
  endDate,
  customerId,
  salonId,
})
```

```ts
transactions.list({
  page,
  pageSize,
  appointmentId,
  customerId,
  currency,
})
```

Sort support should be added only where the UI needs it or where a stable non-default sort is required. Each sortable resource should validate sort fields with an enum instead of accepting arbitrary column names.

## Paged Response Contract

Paged collection responses use one envelope:

```ts
{
  items: T[]
  page: number
  pageSize: number
  totalCount: number
}
```

Small bounded reference collections may remain unpaged only when the result set is intentionally small and operationally safe to load in full. These exceptions should still use `list` and should be obvious in the router implementation. Examples may include option lists used by forms, but only after checking the specific resource.

## Shared API Helpers

Add shared helpers in `packages/api` so routers do not copy pagination and response boilerplate:

- `pageSchema`: validates `page` and `pageSize`, with defaults such as `page: 1` and `pageSize: 25`, and a max `pageSize` of `100`.
- `searchSchema`: trims optional search strings and caps length.
- `getOffset(input)`: returns `(page - 1) * pageSize`.
- `pagedResult(items, input, totalCount)`: returns the standard page envelope.
- Optional sort schema helpers when multiple routers need the same sort shape.

Resource-specific filter schemas remain in their router files unless they are reused by multiple routers.

## Router-Specific Direction

### Customers

Make `customers` the reference implementation:

- Rename `byId` to `get`.
- Change `list` to accept pagination and search.
- Search should match customer name and phone number.
- Return the standard page envelope.
- Keep `summary` as an aggregate read for the customer detail page.
- Keep existing `create` and `update`.
- Do not add `delete`.

### Appointments

- Rename `byId` to `get`.
- Keep `list` as the collection endpoint.
- Fold customer-specific reads into `list({ customerId })`.
- Preserve date range filters.
- Use the standard page envelope for `list`. Calendar views can request a sufficiently large page size with date filters, but the collection contract remains paged.
- Keep `create`.
- Replace `updateMaster` with `update`, accepting only the existing master update capability.
- Keep `linkPersonnel` as a domain action.

### Transactions

- Rename `byAppointmentId` to `list({ appointmentId })`.
- Use the standard page envelope for `list`.
- Keep existing `create`, `update`, and `delete`.
- Keep appointment/customer validation behavior.

### Cash Transactions

- Preserve the current good pattern.
- Align helper usage with the shared pagination and search helpers.
- Keep existing `list`, `create`, `update`, and `delete`.

### Hair Orders

- Rename `byId` to `get`.
- Make `list` accept an object input.
- Use the standard page envelope for `list`.
- Include filters for status, customer, placed date, and arrived date only when those fields are already present in the resource and useful to existing screens.
- Keep `recalculatePrices` as a domain action.
- Keep existing `create` and `update`.
- Do not add `delete`.

### Hair Assigned

- Replace relationship-specific collection names with `list` filters.
- Keep `availableOrders` as a bounded option-list procedure. It returns candidate hair orders for a form workflow, not hair-assigned rows.
- Keep existing `create`, `update`, and `delete`.

### Bank Accounts

- Rename `byId` to `get`.
- Keep existing `create` and `update`.
- Do not add `list` or `delete` unless an existing endpoint already provides that capability.

### Bank Statement Entries

- Keep `list` as the collection endpoint.
- Preserve existing filters.
- Use the standard page envelope for `list`.
- Rename `byId` to `get`.
- Keep `importCsv`, `ignore`, and `undo` as workflow procedures.

### Bank Statement Attachments

- Keep attachment row collections under `list` with filters such as `entryId` and `assigned`.
- Keep `counts` as an aggregate read.
- Keep `assign`, `unassign`, and `delete` if they already exist.
- File upload, preview, and export stay in Hono REST endpoints because they use multipart input or binary/streaming output.

### Legal Entities, Salons, Notes, User Settings

- Rename `byId` to `get` where present.
- Keep existing create/update/delete capabilities only where they already exist.
- Make collection endpoints accept object inputs where practical.
- Do not add missing deletes or creates.
- `userSettings.get` is acceptable because it reads the singleton settings resource for the current user.

### Dashboard And Reports

These routers expose analytical views rather than CRUD resources. Keep descriptive procedure names, but make names consistent within each router. Inputs should be object-shaped and validated with Zod. Outputs should remain domain-specific aggregates.

## Hono Server Structure

The JSON business API remains in tRPC. Hono continues to own:

- `GET|POST /api/auth/*`
- Multipart upload endpoints.
- Binary preview endpoints.
- Archive/export endpoints.
- Health checks.
- The `/trpc/*` mount.

The Hono best-practices guide recommends keeping handlers close to route definitions instead of detached controller-style files, because route-local handlers preserve better type inference for params. For larger Hono apps, the guide recommends splitting route modules and mounting them with `app.route()`.

Apply that guidance if `apps/server/src/index.ts` is split:

- Use Hono route modules for REST endpoints, such as statement attachment files.
- Mount modules with `app.route()`.
- Avoid Rails-style controller files for Hono handlers.
- Do not create dedicated `HEAD` handlers; Hono derives HEAD behavior from GET routes.

This guidance does not require moving tRPC procedures into Hono route modules.

Reference: https://hono.dev/docs/guides/best-practices

## Error Handling

Keep errors tRPC-native:

- Missing auth returns `UNAUTHORIZED` from `protectedProcedure`.
- Missing records return `NOT_FOUND` from `get`, `update`, `delete`, and domain actions targeting a missing row.
- Invalid domain state returns `BAD_REQUEST`.
- Malformed inputs are rejected by Zod.
- Unexpected failures should not be broadly wrapped unless the handler can add useful, non-sensitive domain context.

Mutations targeting existing records should consistently verify affected rows. If an update or delete touches no rows, throw `NOT_FOUND`.

## Web Migration

Update all web call sites in the same PR. No compatibility aliases should remain in the API package.

Expected call-site changes include:

- `trpc.customers.byId` to `trpc.customers.get`.
- `trpc.customers.list.queryOptions()` to `trpc.customers.list.queryOptions({ page, pageSize, search })` or an explicit default input.
- `trpc.appointments.byCustomerId` to `trpc.appointments.list` with `customerId`.
- `trpc.transactions.byAppointmentId` to `trpc.transactions.list` with `appointmentId`.
- `trpc.hairAssigned.byCustomer` and `byAppointment` to `trpc.hairAssigned.list` with the relevant filter.

React Query invalidation should use the new query options or query keys. Where a mutation affects a paged list, invalidate the resource list broadly or use the tRPC query key helper for the resource rather than invalidating only one page unless that is intentional.

## Verification

Required checks after implementation:

- `vp check`
- `vp run -r check-types`
- Relevant package tests, or `vp run -r test` if the workspace has tests available.
- Build checks for affected apps/packages, such as `vp build apps/web` and `vp build apps/server` if configured.

Contract checks should cover:

- Shared pagination defaulting and max page size.
- `customers.list` pagination, search, and response envelope.
- Renamed `get` procedures returning `NOT_FOUND` when appropriate.
- Filtered list behavior for appointment, transaction, hair assigned, and attachment relationship reads.
- Mutation errors for update/delete of missing rows.

Runtime smoke checks should cover:

- Authenticated customer list loads with the new paged response.
- Customer detail route loads with renamed `get` and filtered related-resource lists.
- A create/update/delete workflow invalidates the expected standardized query keys.

## Open Decisions Resolved

- The refactor keeps tRPC and does not add HTTP JSON REST endpoints.
- The refactor is breaking and updates call sites in the same PR.
- Missing CRUD operations are not added.
- Hono REST remains for auth and file/binary workflows.
