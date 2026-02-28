import { useQuery } from "@tanstack/react-query"
import { formatDistanceToNow } from "date-fns"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { trpc } from "@/utils/trpc"

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
