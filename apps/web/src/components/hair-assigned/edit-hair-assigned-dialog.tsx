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
import { hairOrderKeys } from "@/lib/query-keys"

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
      queryClient.invalidateQueries({ queryKey: hairOrderKeys.all })
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
