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
