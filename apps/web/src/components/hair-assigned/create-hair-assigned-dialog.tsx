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
import { hairOrderKeys } from "@/lib/query-keys"

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
    queryKey: [...hairOrderKeys.all, "available"],
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
      queryClient.invalidateQueries({ queryKey: hairOrderKeys.all })
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
