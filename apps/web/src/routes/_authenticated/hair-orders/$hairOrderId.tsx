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
