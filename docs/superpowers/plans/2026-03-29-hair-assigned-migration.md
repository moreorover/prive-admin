# Hair Assigned Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate hair assignment CRUD from Next.js/tRPC/Mantine to TanStack Start server functions + shadcn dialogs, integrated into both hair order and appointment detail pages.

**Architecture:** Shared reusable components in `components/hair-assigned/` consumed by two detail pages. Server functions handle all business logic (profit calculation, weight recalculation) in transactions. Two-step create dialog (pick order, then edit) matches the original UX.

**Tech Stack:** TanStack Start (server functions), TanStack Query (caching), TanStack React Form (forms), Drizzle ORM (queries), shadcn/ui (dialogs, tables), Zod (validation)

---

### Task 1: Validation Schema + Query Keys

**Files:**
- Modify: `apps/web/src/lib/schemas.ts`
- Modify: `apps/web/src/lib/query-keys.ts`

- [ ] **Step 1: Add hairAssignedSchema to schemas.ts**

Add after the `noteSchema` export at the bottom of the file:

```ts
export const hairAssignedSchema = z.object({
  id: z.string().optional(),
  hairOrderId: z.string().min(1, "Hair order is required"),
  clientId: z.string().min(1, "Client is required"),
  appointmentId: z.string().nullish(),
  weightInGrams: z.number().min(0),
  soldFor: z.number().min(0),
})

export type HairAssignedInput = z.infer<typeof hairAssignedSchema>
```

- [ ] **Step 2: Add hairAssignedKeys to query-keys.ts**

Add after the `noteKeys` export at the bottom of the file:

```ts
export const hairAssignedKeys = {
  all: ["hair-assigned"] as const,
  byHairOrder: (id: string) => [...hairAssignedKeys.all, "by-hair-order", id] as const,
  byAppointment: (id: string) => [...hairAssignedKeys.all, "by-appointment", id] as const,
}
```

- [ ] **Step 3: Verify types compile**

Run: `cd apps/web && bunx tsc --noEmit`
Expected: No errors related to schemas or query keys.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/lib/schemas.ts apps/web/src/lib/query-keys.ts
git commit -m "feat: add hair assigned schema and query keys"
```

---

### Task 2: Server Functions

**Files:**
- Create: `apps/web/src/functions/hair-assigned.ts`

- [ ] **Step 1: Create hair-assigned.ts with all server functions**

Create `apps/web/src/functions/hair-assigned.ts`:

```ts
import { db } from "@prive-admin-tanstack/db"
import { hairAssigned, hairOrder } from "@prive-admin-tanstack/db/schema/hair"
import { createServerFn } from "@tanstack/react-start"
import { eq, gt, sql } from "drizzle-orm"
import { z } from "zod"

import { requireAuthMiddleware } from "@/middleware/auth"

export const getHairAssignedByHairOrder = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .inputValidator(z.object({ hairOrderId: z.string() }))
  .handler(async ({ data }) => {
    return db.query.hairAssigned.findMany({
      where: eq(hairAssigned.hairOrderId, data.hairOrderId),
      with: { client: true },
    })
  })

export const getHairAssignedByAppointment = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .inputValidator(z.object({ appointmentId: z.string() }))
  .handler(async ({ data }) => {
    return db.query.hairAssigned.findMany({
      where: eq(hairAssigned.appointmentId, data.appointmentId),
      with: { client: true, hairOrder: true },
    })
  })

export const getAvailableHairOrders = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .handler(async () => {
    return db.query.hairOrder.findMany({
      where: gt(
        sql`${hairOrder.weightReceived} - ${hairOrder.weightUsed}`,
        0,
      ),
      with: { customer: true },
      orderBy: (hairOrder, { asc }) => [asc(hairOrder.uid)],
    })
  })

export const createHairAssigned = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator(
    z.object({
      hairOrderId: z.string().min(1),
      clientId: z.string().min(1),
      appointmentId: z.string().nullish(),
    }),
  )
  .handler(async ({ data, context }) => {
    const [result] = await db
      .insert(hairAssigned)
      .values({
        hairOrderId: data.hairOrderId,
        clientId: data.clientId,
        appointmentId: data.appointmentId ?? null,
        createdById: context.session.user.id,
      })
      .returning()
    return result
  })

export const updateHairAssigned = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator(
    z.object({
      id: z.string().min(1),
      weightInGrams: z.number().min(0),
      soldFor: z.number().min(0),
    }),
  )
  .handler(async ({ data }) => {
    const existing = await db.query.hairAssigned.findFirst({
      where: eq(hairAssigned.id, data.id),
      with: { hairOrder: true },
    })
    if (!existing) throw new Error("Hair assigned not found")

    const parentOrder = existing.hairOrder
    const availableWeight =
      parentOrder.weightReceived - parentOrder.weightUsed + existing.weightInGrams
    if (data.weightInGrams > availableWeight) {
      throw new Error(
        `Weight exceeds available stock (${availableWeight}g available)`,
      )
    }

    const pricePerGram =
      data.weightInGrams > 0
        ? Math.round(data.soldFor / data.weightInGrams)
        : 0
    const profit =
      data.soldFor - data.weightInGrams * parentOrder.pricePerGram

    return await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(hairAssigned)
        .set({
          weightInGrams: data.weightInGrams,
          soldFor: data.soldFor,
          pricePerGram,
          profit,
        })
        .where(eq(hairAssigned.id, data.id))
        .returning()

      const weightAgg = await tx
        .select({ total: sql<number>`coalesce(sum(${hairAssigned.weightInGrams}), 0)` })
        .from(hairAssigned)
        .where(eq(hairAssigned.hairOrderId, parentOrder.id))

      await tx
        .update(hairOrder)
        .set({ weightUsed: Number(weightAgg[0].total) })
        .where(eq(hairOrder.id, parentOrder.id))

      return updated
    })
  })

export const deleteHairAssigned = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    const existing = await db.query.hairAssigned.findFirst({
      where: eq(hairAssigned.id, data.id),
    })
    if (!existing) throw new Error("Hair assigned not found")

    return await db.transaction(async (tx) => {
      await tx.delete(hairAssigned).where(eq(hairAssigned.id, data.id))

      const weightAgg = await tx
        .select({ total: sql<number>`coalesce(sum(${hairAssigned.weightInGrams}), 0)` })
        .from(hairAssigned)
        .where(eq(hairAssigned.hairOrderId, existing.hairOrderId))

      await tx
        .update(hairOrder)
        .set({ weightUsed: Number(weightAgg[0].total) })
        .where(eq(hairOrder.id, existing.hairOrderId))
    })
  })
```

- [ ] **Step 2: Verify types compile**

Run: `cd apps/web && bunx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/functions/hair-assigned.ts
git commit -m "feat: add hair assigned server functions"
```

---

### Task 3: Hair Assigned Table Component

**Files:**
- Create: `apps/web/src/components/hair-assigned/hair-assigned-table.tsx`

- [ ] **Step 1: Create the table component**

Create `apps/web/src/components/hair-assigned/hair-assigned-table.tsx`:

```tsx
import { Button } from "@prive-admin-tanstack/ui/components/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@prive-admin-tanstack/ui/components/table"
import { Link } from "@tanstack/react-router"
import { Edit, Trash2 } from "lucide-react"

type HairAssignedRow = {
  id: string
  weightInGrams: number
  soldFor: number
  profit: number
  pricePerGram: number
  client?: { id: string; name: string } | null
  hairOrder?: { id: string; uid: number } | null
}

type HairAssignedTableProps = {
  items: HairAssignedRow[]
  showHairOrderColumn?: boolean
  onEdit: (item: HairAssignedRow) => void
  onDelete: (item: HairAssignedRow) => void
}

const formatCents = (cents: number) => `$${(cents / 100).toFixed(2)}`

export function HairAssignedTable({
  items,
  showHairOrderColumn = false,
  onEdit,
  onDelete,
}: HairAssignedTableProps) {
  return (
    <>
      {items.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              {showHairOrderColumn && <TableHead>Hair Order</TableHead>}
              <TableHead>Weight</TableHead>
              <TableHead>Sold For</TableHead>
              <TableHead>Profit</TableHead>
              <TableHead>$/g</TableHead>
              <TableHead className="w-[80px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((ha) => {
              const needsAttention = ha.weightInGrams === 0 || ha.soldFor === 0
              return (
                <TableRow
                  key={ha.id}
                  className={needsAttention ? "bg-destructive/10" : undefined}
                >
                  <TableCell>
                    {ha.client ? (
                      <Link
                        to="/customers/$customerId"
                        params={{ customerId: ha.client.id }}
                        className="text-primary hover:underline"
                      >
                        {ha.client.name}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  {showHairOrderColumn && (
                    <TableCell>
                      {ha.hairOrder ? (
                        <Link
                          to="/hair-orders/$hairOrderId"
                          params={{ hairOrderId: ha.hairOrder.id }}
                          className="text-primary hover:underline"
                        >
                          #{ha.hairOrder.uid}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                  )}
                  <TableCell>{ha.weightInGrams}g</TableCell>
                  <TableCell>{formatCents(ha.soldFor)}</TableCell>
                  <TableCell>{formatCents(ha.profit)}</TableCell>
                  <TableCell>{formatCents(ha.pricePerGram)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={() => onEdit(ha)}
                      >
                        <Edit className="size-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-destructive hover:text-destructive"
                        onClick={() => onDelete(ha)}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      ) : (
        <p className="text-sm text-muted-foreground">No hair assigned yet.</p>
      )}
    </>
  )
}
```

- [ ] **Step 2: Verify types compile**

Run: `cd apps/web && bunx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/hair-assigned/hair-assigned-table.tsx
git commit -m "feat: add hair assigned table component"
```

---

### Task 4: Create Hair Assigned Dialog (Two-Step)

**Files:**
- Create: `apps/web/src/components/hair-assigned/create-hair-assigned-dialog.tsx`

- [ ] **Step 1: Create the two-step dialog**

Create `apps/web/src/components/hair-assigned/create-hair-assigned-dialog.tsx`:

```tsx
import { Button } from "@prive-admin-tanstack/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@prive-admin-tanstack/ui/components/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@prive-admin-tanstack/ui/components/table"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { toast } from "sonner"

import { createHairAssigned, getAvailableHairOrders } from "@/functions/hair-assigned"
import { hairAssignedKeys } from "@/lib/query-keys"

type CreateHairAssignedDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientId: string
  appointmentId?: string | null
  invalidateKeys: { queryKey: readonly unknown[] }[]
}

export function CreateHairAssignedDialog({
  open,
  onOpenChange,
  clientId,
  appointmentId,
  invalidateKeys,
}: CreateHairAssignedDialogProps) {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data: availableOrders, isLoading } = useQuery({
    queryKey: ["hair-orders", "available"],
    queryFn: () => getAvailableHairOrders(),
    enabled: open,
  })

  const mutation = useMutation({
    mutationFn: (hairOrderId: string) =>
      createHairAssigned({
        data: { hairOrderId, clientId, appointmentId: appointmentId ?? null },
      }),
    onSuccess: () => {
      for (const key of invalidateKeys) {
        queryClient.invalidateQueries(key)
      }
      onOpenChange(false)
      setSelectedOrderId(null)
      toast.success("Hair assigned created")
    },
    onError: (error) => toast.error(error.message),
  })

  const handleCreate = () => {
    if (!selectedOrderId) return
    mutation.mutate(selectedOrderId)
  }

  const handleOpenChange = (value: boolean) => {
    if (!value) setSelectedOrderId(null)
    onOpenChange(value)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Assign Hair</DialogTitle>
          <DialogDescription>
            Select a hair order with available stock.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : availableOrders && availableOrders.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]" />
                <TableHead>UID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Received</TableHead>
                <TableHead>Remaining</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {availableOrders.map((order) => (
                <TableRow
                  key={order.id}
                  className={
                    selectedOrderId === order.id
                      ? "bg-accent"
                      : "cursor-pointer"
                  }
                  onClick={() => setSelectedOrderId(order.id)}
                >
                  <TableCell>
                    <input
                      type="radio"
                      name="hairOrder"
                      checked={selectedOrderId === order.id}
                      onChange={() => setSelectedOrderId(order.id)}
                    />
                  </TableCell>
                  <TableCell>#{order.uid}</TableCell>
                  <TableCell>{order.customer.name}</TableCell>
                  <TableCell>{order.weightReceived}g</TableCell>
                  <TableCell>
                    {order.weightReceived - order.weightUsed}g
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-sm text-muted-foreground">
            No hair orders with available stock.
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!selectedOrderId || mutation.isPending}
          >
            {mutation.isPending ? "Creating..." : "Assign"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: Verify types compile**

Run: `cd apps/web && bunx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/hair-assigned/create-hair-assigned-dialog.tsx
git commit -m "feat: add create hair assigned dialog"
```

---

### Task 5: Edit Hair Assigned Dialog

**Files:**
- Create: `apps/web/src/components/hair-assigned/edit-hair-assigned-dialog.tsx`

- [ ] **Step 1: Create the edit dialog**

Create `apps/web/src/components/hair-assigned/edit-hair-assigned-dialog.tsx`:

```tsx
import { Button } from "@prive-admin-tanstack/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@prive-admin-tanstack/ui/components/dialog"
import { Input } from "@prive-admin-tanstack/ui/components/input"
import { Label } from "@prive-admin-tanstack/ui/components/label"
import { useForm } from "@tanstack/react-form"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { updateHairAssigned } from "@/functions/hair-assigned"

type EditHairAssignedDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  hairAssigned: {
    id: string
    weightInGrams: number
    soldFor: number
  }
  invalidateKeys: { queryKey: readonly unknown[] }[]
}

export function EditHairAssignedDialog({
  open,
  onOpenChange,
  hairAssigned,
  invalidateKeys,
}: EditHairAssignedDialogProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (data: { id: string; weightInGrams: number; soldFor: number }) =>
      updateHairAssigned({ data }),
    onSuccess: () => {
      for (const key of invalidateKeys) {
        queryClient.invalidateQueries(key)
      }
      onOpenChange(false)
      toast.success("Hair assigned updated")
    },
    onError: (error) => toast.error(error.message),
  })

  const form = useForm({
    defaultValues: {
      weightInGrams: hairAssigned.weightInGrams,
      soldFor: hairAssigned.soldFor,
    },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync({
        id: hairAssigned.id,
        weightInGrams: value.weightInGrams,
        soldFor: value.soldFor,
      })
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Hair Assigned</DialogTitle>
          <DialogDescription>Update weight and sale price.</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
          className="space-y-4"
        >
          <form.Field name="weightInGrams">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Weight (grams)</Label>
                <Input
                  id={field.name}
                  type="number"
                  min={0}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(Number(e.target.value))}
                />
              </div>
            )}
          </form.Field>
          <form.Field name="soldFor">
            {(field) => (
              <div className="space-y-2">
                <Label htmlFor={field.name}>Sold For (cents)</Label>
                <Input
                  id={field.name}
                  type="number"
                  min={0}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(Number(e.target.value))}
                />
              </div>
            )}
          </form.Field>
          <form.Subscribe
            selector={(state) => ({
              canSubmit: state.canSubmit,
              isSubmitting: state.isSubmitting,
            })}
          >
            {({ canSubmit, isSubmitting }) => (
              <Button
                type="submit"
                className="w-full"
                disabled={!canSubmit || isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            )}
          </form.Subscribe>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: Verify types compile**

Run: `cd apps/web && bunx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/hair-assigned/edit-hair-assigned-dialog.tsx
git commit -m "feat: add edit hair assigned dialog"
```

---

### Task 6: Delete Hair Assigned Dialog

**Files:**
- Create: `apps/web/src/components/hair-assigned/delete-hair-assigned-dialog.tsx`

- [ ] **Step 1: Create the delete confirmation dialog**

Create `apps/web/src/components/hair-assigned/delete-hair-assigned-dialog.tsx`:

```tsx
import { Button } from "@prive-admin-tanstack/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@prive-admin-tanstack/ui/components/dialog"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import { deleteHairAssigned } from "@/functions/hair-assigned"

type DeleteHairAssignedDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  hairAssigned: {
    id: string
    weightInGrams: number
    client?: { name: string } | null
    hairOrder?: { uid: number } | null
  }
  invalidateKeys: { queryKey: readonly unknown[] }[]
}

export function DeleteHairAssignedDialog({
  open,
  onOpenChange,
  hairAssigned,
  invalidateKeys,
}: DeleteHairAssignedDialogProps) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: () => deleteHairAssigned({ data: { id: hairAssigned.id } }),
    onSuccess: () => {
      for (const key of invalidateKeys) {
        queryClient.invalidateQueries(key)
      }
      onOpenChange(false)
      toast.success("Hair assigned deleted")
    },
    onError: (error) => toast.error(error.message),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Hair Assigned</DialogTitle>
          <DialogDescription>
            This will remove the assignment of {hairAssigned.weightInGrams}g
            {hairAssigned.client ? ` for ${hairAssigned.client.name}` : ""}
            {hairAssigned.hairOrder
              ? ` from order #${hairAssigned.hairOrder.uid}`
              : ""}
            . This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: Verify types compile**

Run: `cd apps/web && bunx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/hair-assigned/delete-hair-assigned-dialog.tsx
git commit -m "feat: add delete hair assigned dialog"
```

---

### Task 7: Integrate into Hair Order Detail Page

**Files:**
- Modify: `apps/web/src/routes/_authenticated/hair-orders/$hairOrderId.tsx`

- [ ] **Step 1: Replace inline table with shared components**

Replace the entire file content of `apps/web/src/routes/_authenticated/hair-orders/$hairOrderId.tsx` with:

```tsx
import { Badge } from "@prive-admin-tanstack/ui/components/badge"
import { Button } from "@prive-admin-tanstack/ui/components/button"
import { Card, CardContent, CardHeader, CardTitle } from "@prive-admin-tanstack/ui/components/card"
import { Separator } from "@prive-admin-tanstack/ui/components/separator"
import { Skeleton } from "@prive-admin-tanstack/ui/components/skeleton"
import { useQuery, queryOptions } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"
import { ArrowLeft, Plus, User } from "lucide-react"
import { useState } from "react"

import { CreateHairAssignedDialog } from "@/components/hair-assigned/create-hair-assigned-dialog"
import { DeleteHairAssignedDialog } from "@/components/hair-assigned/delete-hair-assigned-dialog"
import { EditHairAssignedDialog } from "@/components/hair-assigned/edit-hair-assigned-dialog"
import { HairAssignedTable } from "@/components/hair-assigned/hair-assigned-table"
import { getHairOrder } from "@/functions/hair-orders"
import { hairOrderKeys } from "@/lib/query-keys"

export const Route = createFileRoute("/_authenticated/hair-orders/$hairOrderId")({
  component: HairOrderDetailPage,
  loader: async ({ context, params }) => {
    await context.queryClient.prefetchQuery(
      queryOptions({
        queryKey: hairOrderKeys.detail(params.hairOrderId),
        queryFn: () => getHairOrder({ data: { id: params.hairOrderId } }),
      }),
    )
  },
})

type HairAssignedItem = {
  id: string
  weightInGrams: number
  soldFor: number
  profit: number
  pricePerGram: number
  client?: { id: string; name: string } | null
  hairOrder?: { id: string; uid: number } | null
}

function HairOrderDetailPage() {
  const { hairOrderId } = Route.useParams()
  const [createOpen, setCreateOpen] = useState(false)
  const [editItem, setEditItem] = useState<HairAssignedItem | null>(null)
  const [deleteItem, setDeleteItem] = useState<HairAssignedItem | null>(null)

  const { data: hairOrder, isLoading } = useQuery({
    queryKey: hairOrderKeys.detail(hairOrderId),
    queryFn: () => getHairOrder({ data: { id: hairOrderId } }),
  })

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-8 px-6 py-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (!hairOrder) {
    return <div className="px-6 py-8 text-muted-foreground">Hair order not found.</div>
  }

  const formatCents = (cents: number) => `$${(cents / 100).toFixed(2)}`

  const invalidateKeys = [
    { queryKey: hairOrderKeys.detail(hairOrderId) },
  ]

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-6 py-8">
      <div className="space-y-1">
        <Link
          to="/hair-orders"
          className="mb-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3" />
          Back to hair orders
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="font-heading text-2xl font-bold tracking-tight">Hair Order #{hairOrder.uid}</h1>
          <Badge variant={hairOrder.status === "COMPLETED" ? "default" : "outline"}>{hairOrder.status}</Badge>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <User className="size-3" />
            <Link
              to="/customers/$customerId"
              params={{ customerId: hairOrder.customer.id }}
              className="text-primary hover:underline"
            >
              {hairOrder.customer.name}
            </Link>
          </span>
          <span>Created by {hairOrder.createdBy?.name ?? "Unknown"}</span>
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Weight Received</p>
            <p className="text-lg font-bold">{hairOrder.weightReceived}g</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Weight Used</p>
            <p className="text-lg font-bold">{hairOrder.weightUsed}g</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Price/Gram</p>
            <p className="text-lg font-bold">{formatCents(hairOrder.pricePerGram)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-lg font-bold">{formatCents(hairOrder.total)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Hair Assigned</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="size-3" />
              Add
            </Button>
          </CardHeader>
          <CardContent>
            <HairAssignedTable
              items={hairOrder.hairAssigned ?? []}
              onEdit={setEditItem}
              onDelete={setDeleteItem}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            {hairOrder.notes && hairOrder.notes.length > 0 ? (
              <div className="space-y-3">
                {hairOrder.notes.map((n) => (
                  <div key={n.id} className="rounded-md border p-3">
                    <p className="text-sm">{n.note}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {n.createdBy?.name ?? "Unknown"} &middot; {new Date(n.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No notes.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <CreateHairAssignedDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        clientId={hairOrder.customer.id}
        invalidateKeys={invalidateKeys}
      />

      {editItem && (
        <EditHairAssignedDialog
          open={!!editItem}
          onOpenChange={(open) => !open && setEditItem(null)}
          hairAssigned={editItem}
          invalidateKeys={invalidateKeys}
        />
      )}

      {deleteItem && (
        <DeleteHairAssignedDialog
          open={!!deleteItem}
          onOpenChange={(open) => !open && setDeleteItem(null)}
          hairAssigned={deleteItem}
          invalidateKeys={invalidateKeys}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify types compile**

Run: `cd apps/web && bunx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Manually test in browser**

Navigate to a hair order detail page. Verify:
- Hair assigned table renders (or shows empty state)
- "Add" button opens create dialog with available orders
- Selecting an order and clicking "Assign" creates the assignment
- Edit button opens edit dialog with current values
- Delete button opens confirmation dialog

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/routes/_authenticated/hair-orders/\$hairOrderId.tsx
git commit -m "feat: integrate hair assigned dialogs into hair order detail"
```

---

### Task 8: Integrate into Appointment Detail Page

**Files:**
- Modify: `apps/web/src/routes/_authenticated/appointments/$appointmentId.tsx`

- [ ] **Step 1: Add hair assigned section to appointment detail**

Replace the entire file content of `apps/web/src/routes/_authenticated/appointments/$appointmentId.tsx` with:

```tsx
import { Button } from "@prive-admin-tanstack/ui/components/button"
import { Card, CardContent, CardHeader, CardTitle } from "@prive-admin-tanstack/ui/components/card"
import { Separator } from "@prive-admin-tanstack/ui/components/separator"
import { Skeleton } from "@prive-admin-tanstack/ui/components/skeleton"
import { useQuery, queryOptions } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"
import { ArrowLeft, Clock, Plus, User } from "lucide-react"
import { useState } from "react"

import { CreateHairAssignedDialog } from "@/components/hair-assigned/create-hair-assigned-dialog"
import { DeleteHairAssignedDialog } from "@/components/hair-assigned/delete-hair-assigned-dialog"
import { EditHairAssignedDialog } from "@/components/hair-assigned/edit-hair-assigned-dialog"
import { HairAssignedTable } from "@/components/hair-assigned/hair-assigned-table"
import { getAppointment } from "@/functions/appointments"
import { getHairAssignedByAppointment } from "@/functions/hair-assigned"
import { appointmentKeys, hairAssignedKeys } from "@/lib/query-keys"

export const Route = createFileRoute("/_authenticated/appointments/$appointmentId")({
  component: AppointmentDetailPage,
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.prefetchQuery(
        queryOptions({
          queryKey: appointmentKeys.detail(params.appointmentId),
          queryFn: () => getAppointment({ data: { id: params.appointmentId } }),
        }),
      ),
      context.queryClient.prefetchQuery(
        queryOptions({
          queryKey: hairAssignedKeys.byAppointment(params.appointmentId),
          queryFn: () => getHairAssignedByAppointment({ data: { appointmentId: params.appointmentId } }),
        }),
      ),
    ])
  },
})

type HairAssignedItem = {
  id: string
  weightInGrams: number
  soldFor: number
  profit: number
  pricePerGram: number
  client?: { id: string; name: string } | null
  hairOrder?: { id: string; uid: number } | null
}

function AppointmentDetailPage() {
  const { appointmentId } = Route.useParams()
  const [createOpen, setCreateOpen] = useState(false)
  const [editItem, setEditItem] = useState<HairAssignedItem | null>(null)
  const [deleteItem, setDeleteItem] = useState<HairAssignedItem | null>(null)

  const { data: appointment, isLoading } = useQuery({
    queryKey: appointmentKeys.detail(appointmentId),
    queryFn: () => getAppointment({ data: { id: appointmentId } }),
  })

  const { data: hairAssigned } = useQuery({
    queryKey: hairAssignedKeys.byAppointment(appointmentId),
    queryFn: () => getHairAssignedByAppointment({ data: { appointmentId } }),
  })

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-8 px-6 py-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (!appointment) {
    return <div className="px-6 py-8 text-muted-foreground">Appointment not found.</div>
  }

  const invalidateKeys = [
    { queryKey: appointmentKeys.detail(appointmentId) },
    { queryKey: hairAssignedKeys.byAppointment(appointmentId) },
  ]

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-6 py-8">
      <div className="space-y-1">
        <Link
          to="/appointments"
          className="mb-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3" />
          Back to appointments
        </Link>
        <h1 className="font-heading text-2xl font-bold tracking-tight">{appointment.name}</h1>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="size-3" />
            {new Date(appointment.startsAt).toLocaleString()}
          </span>
          <span className="flex items-center gap-1">
            <User className="size-3" />
            <Link
              to="/customers/$customerId"
              params={{ customerId: appointment.client.id }}
              className="text-primary hover:underline"
            >
              {appointment.client.name}
            </Link>
          </span>
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Personnel</CardTitle>
          </CardHeader>
          <CardContent>
            {appointment.personnel && appointment.personnel.length > 0 ? (
              <div className="space-y-2">
                {appointment.personnel.map((p) => (
                  <div key={p.personnelId} className="flex items-center gap-2 rounded-md border p-2">
                    <User className="size-3 text-muted-foreground" />
                    <span className="text-sm">{p.personnel.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No personnel assigned.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Hair Assigned</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="size-3" />
              Add
            </Button>
          </CardHeader>
          <CardContent>
            <HairAssignedTable
              items={hairAssigned ?? []}
              showHairOrderColumn
              onEdit={setEditItem}
              onDelete={setDeleteItem}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            {appointment.notes && appointment.notes.length > 0 ? (
              <div className="space-y-3">
                {appointment.notes.map((n) => (
                  <div key={n.id} className="rounded-md border p-3">
                    <p className="text-sm">{n.note}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {n.createdBy?.name ?? "Unknown"} &middot; {new Date(n.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No notes.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <CreateHairAssignedDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        clientId={appointment.client.id}
        appointmentId={appointmentId}
        invalidateKeys={invalidateKeys}
      />

      {editItem && (
        <EditHairAssignedDialog
          open={!!editItem}
          onOpenChange={(open) => !open && setEditItem(null)}
          hairAssigned={editItem}
          invalidateKeys={invalidateKeys}
        />
      )}

      {deleteItem && (
        <DeleteHairAssignedDialog
          open={!!deleteItem}
          onOpenChange={(open) => !open && setDeleteItem(null)}
          hairAssigned={deleteItem}
          invalidateKeys={invalidateKeys}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify types compile**

Run: `cd apps/web && bunx tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Manually test in browser**

Navigate to an appointment detail page. Verify:
- Hair Assigned card appears with Hair Order UID column
- "Add" button opens create dialog
- Edit and delete work correctly
- Hair order detail page still works after changes

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/routes/_authenticated/appointments/\$appointmentId.tsx
git commit -m "feat: integrate hair assigned into appointment detail page"
```
