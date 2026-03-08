import { useMutation, useQuery } from "@tanstack/react-query"
import { format, formatDistanceToNow } from "date-fns"
import { Undo2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { queryClient, trpc } from "@/utils/trpc"

const fieldLabels: Record<string, string> = {
  customerId: "Customer",
  startsAt: "Starts At",
  endsAt: "Ends At",
  placedAt: "Placed At",
  arrivedAt: "Arrived At",
  weightReceived: "Weight Received",
}

function formatFieldName(fieldName: string): string {
  return fieldLabels[fieldName] ?? fieldName.charAt(0).toUpperCase() + fieldName.slice(1)
}

function formatValue(value: string | null): string {
  if (!value) return "—"
  const date = new Date(value)
  if (!Number.isNaN(date.getTime()) && /^\d{4}-|^\w{3}\s\w{3}\s\d{2}/.test(value)) {
    return format(date, "dd MMM yyyy, HH:mm")
  }
  return value
}

export function EntityHistory({
  entityType,
  entityId,
}: {
  entityType: "customer" | "hair_order" | "appointment"
  entityId: string
}) {
  const history = useQuery(trpc.entityHistory.getByEntity.queryOptions({ entityType, entityId }))

  const revert = useMutation(
    trpc.entityHistory.revert.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [["entityHistory", "getByEntity"]],
        })
        if (entityType === "customer") {
          queryClient.invalidateQueries({
            queryKey: [["customer", "getById"]],
          })
        } else if (entityType === "hair_order") {
          queryClient.invalidateQueries({
            queryKey: [["hairOrder", "getById"]],
          })
        } else if (entityType === "appointment") {
          queryClient.invalidateQueries({
            queryKey: [["appointment", "getById"]],
          })
        }
        toast.success("Change reverted")
      },
    }),
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change History</CardTitle>
      </CardHeader>
      <CardContent>
        {history.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : !history.data?.length ? (
          <p className="text-sm text-muted-foreground">No changes recorded.</p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Field</TableHead>
                  <TableHead>Old Value</TableHead>
                  <TableHead>New Value</TableHead>
                  <TableHead>Changed By</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.data.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">{formatFieldName(entry.fieldName)}</TableCell>
                    <TableCell className="text-muted-foreground">{formatValue(entry.oldDisplayValue ?? entry.oldValue)}</TableCell>
                    <TableCell>{formatValue(entry.newDisplayValue ?? entry.newValue)}</TableCell>
                    <TableCell>{entry.changedByName ?? "Unknown"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDistanceToNow(new Date(entry.changedAt), {
                        addSuffix: true,
                      })}
                    </TableCell>
                    <TableCell>
                      {entry.fieldName !== "deleted" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          disabled={revert.isPending}
                          onClick={() => revert.mutate({ historyId: entry.id })}
                        >
                          <Undo2 className="size-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
