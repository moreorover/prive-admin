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
import { hairOrderKeys } from "@/lib/query-keys"

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
      queryClient.invalidateQueries({ queryKey: hairOrderKeys.all })
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
