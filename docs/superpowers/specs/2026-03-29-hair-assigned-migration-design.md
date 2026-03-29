# Hair Assigned Migration Design

Migrate the hair assignment feature from Next.js/tRPC/Mantine to TanStack Start/Drizzle/shadcn, using shared dialog components integrated into both hair order and appointment detail pages.

## Server Functions

New file `apps/web/src/functions/hair-assigned.ts`:

- `getHairAssignedByHairOrder(hairOrderId)` — all assignments for a hair order, with client
- `getHairAssignedByAppointment(appointmentId)` — all assignments for an appointment, with hairOrder and client
- `getAvailableHairOrders()` — hair orders where `weightReceived > weightUsed`
- `createHairAssigned(hairOrderId, clientId, appointmentId?)` — create assignment, set `createdById` from session
- `updateHairAssigned(id, weightInGrams, soldFor)` — update weight/price, recalculate profit/pricePerGram, update parent `hairOrder.weightUsed`
- `deleteHairAssigned(id)` — delete assignment, recalculate parent `hairOrder.weightUsed`

All protected with `requireAuthMiddleware`, validated with Zod. Update and delete recalculations run in a transaction.

## Validation Schema

In `lib/schemas.ts`:

```ts
export const hairAssignedSchema = z.object({
  id: z.string().optional(),
  hairOrderId: z.string().min(1, "Hair order is required"),
  clientId: z.string().min(1, "Client is required"),
  appointmentId: z.string().nullish(),
  weightInGrams: z.number().min(0),
  soldFor: z.number().min(0),
})
```

## Query Keys

In `lib/query-keys.ts`:

```ts
export const hairAssignedKeys = {
  all: ["hair-assigned"] as const,
  byHairOrder: (id: string) => [...hairAssignedKeys.all, "by-hair-order", id] as const,
  byAppointment: (id: string) => [...hairAssignedKeys.all, "by-appointment", id] as const,
}
```

## Shared Components

New directory `apps/web/src/components/hair-assigned/`:

### `hair-assigned-table.tsx`

Reusable table for displaying assignments. Props control column visibility:

- Columns: Client, Hair Order UID (visible in appointment context), Weight, Sold For, Profit, Price/Gram
- Row actions: Edit, Delete
- Red visual indicator for rows where weight=0 or soldFor=0
- "Add" button in header triggers create flow

### `create-hair-assigned-dialog.tsx`

Two-step dialog matching main's UX:

- Step 1: Table of available hair orders (remaining stock > 0). Columns: UID, Customer, Weight Received, Weight Remaining. Radio to select one.
- Step 2: Form with `weightInGrams` (max = remaining stock) and `soldFor` inputs
- Props: `clientId`, `appointmentId?`, `onSuccess`

### `edit-hair-assigned-dialog.tsx`

Single-step dialog:

- Fields: `weightInGrams` (max = remaining stock + current weight), `soldFor`
- Props: `hairAssigned` object, `onSuccess`

### `delete-hair-assigned-dialog.tsx`

Confirmation dialog showing what's being deleted (client name, weight, hair order UID).

All dialogs use `@tanstack/react-form` + `useMutation` pattern matching existing codebase conventions.

## Page Integration

### Hair Order Detail (`hair-orders/$hairOrderId.tsx`)

- Replace inline hair assigned table with `HairAssignedTable` component
- "Assign Hair" button opens `CreateHairAssignedDialog` with `clientId` from the hair order's customer
- On mutation success: invalidate `hairOrderKeys.detail` + `hairAssignedKeys.byHairOrder`

### Appointment Detail (`appointments/$appointmentId.tsx`)

- Add "Hair Assigned" card section alongside Personnel and Notes
- Fetch hair assigned via `getHairAssignedByAppointment` with dedicated query
- `HairAssignedTable` with Hair Order UID column visible
- "Assign Hair" button opens `CreateHairAssignedDialog` with `clientId` from appointment's client + `appointmentId`
- On mutation success: invalidate `appointmentKeys.detail` + `hairAssignedKeys.byAppointment`

### Cache Invalidation

All mutations also invalidate `hairOrderKeys.detail` for the parent order since `weightUsed` changes.

## Business Logic

**Create**: Sets `weightInGrams=0` and `soldFor=0` initially. User edits after creation (matching main's flow). Sets `createdById` from auth session.

**Update**: When weight or soldFor changes:
- `pricePerGram = Math.round(soldFor / weightInGrams)` (0 if weight is 0)
- `profit = soldFor - (weightInGrams * parentHairOrder.pricePerGram)`
- Recalculate parent `hairOrder.weightUsed` = sum of all assignments' `weightInGrams`
- Validate: new weight cannot exceed `parentHairOrder.weightReceived - weightUsed + currentAssignment.weightInGrams`

**Delete**: Recalculate parent `hairOrder.weightUsed` after removal. All recalculations in a transaction.
