import { useMutation, useQuery } from "@tanstack/react-query"
import { formatDistanceToNow } from "date-fns"
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

export function EntityHistory({
  entityType,
  entityId,
}: {
  entityType: "customer" | "hair_order"
  entityId: string
}) {
  const history = useQuery(
    trpc.entityHistory.getByEntity.queryOptions({ entityType, entityId }),
  )

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
        } else {
          queryClient.invalidateQueries({
            queryKey: [["hairOrder", "getById"]],
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
          <p className="text-muted-foreground text-sm">Loading...</p>
        ) : !history.data?.length ? (
          <p className="text-muted-foreground text-sm">No changes recorded.</p>
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
                    <TableCell className="font-medium">{entry.fieldName}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {entry.oldValue ?? "—"}
                    </TableCell>
                    <TableCell>{entry.newValue ?? "—"}</TableCell>
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
                          onClick={() =>
                            revert.mutate({ historyId: entry.id })
                          }
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
