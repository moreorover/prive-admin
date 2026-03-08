import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { format } from "date-fns"
import { PencilIcon, PlusIcon } from "lucide-react"

import { EntityHistory } from "@/components/entity-history"
import { Badge } from "@/components/ui/badge"
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
import { trpc } from "@/utils/trpc"

export const Route = createFileRoute("/admin/customers/$id/")({
  staticData: { title: "View Customer" },
  component: ViewCustomerPage,
})

function formatCents(cents: number): string {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(cents / 100)
}

const typeLabels: Record<string, string> = {
  bank: "Bank",
  cash: "Cash",
  paypal: "PayPal",
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-4 py-3">
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="col-span-2 text-sm">{children}</dd>
    </div>
  )
}

function ViewCustomerPage() {
  const { id } = Route.useParams()

  const customerQuery = useQuery(trpc.customer.getById.queryOptions({ id }))
  const transactionsQuery = useQuery(trpc.transaction.getByCustomer.queryOptions({ customerId: id }))

  if (customerQuery.isLoading) {
    return <div className="text-center text-muted-foreground">Loading...</div>
  }

  if (!customerQuery.data) {
    return <div className="text-center text-muted-foreground">Customer not found.</div>
  }

  const cust = customerQuery.data

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{cust.name}</CardTitle>
          <Button asChild size="sm" variant="outline">
            <Link to="/admin/customers/$id/edit" params={{ id }}>
              <PencilIcon className="mr-2 size-4" />
              Edit
            </Link>
          </Button>
        </CardHeader>

        <CardContent>
          <dl className="divide-y">
            <DetailRow label="Email">
              {cust.email ?? "—"}
            </DetailRow>

            <DetailRow label="Phone">
              {cust.phone ?? "—"}
            </DetailRow>

            <DetailRow label="Created at">
              {format(new Date(cust.createdAt), "dd MMM yyyy, HH:mm")}
            </DetailRow>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Transactions</CardTitle>
          <Button asChild size="sm">
            <Link to="/admin/transactions/new">
              <PlusIcon className="mr-2 size-4" />
              Add Transaction
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {transactionsQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : !transactionsQuery.data?.length ? (
            <p className="text-sm text-muted-foreground">No transactions yet.</p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactionsQuery.data.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>{format(new Date(tx.date), "dd MMM yyyy")}</TableCell>
                      <TableCell>{tx.description ?? "—"}</TableCell>
                      <TableCell>
                        <span
                          className={
                            tx.amount >= 0
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }
                        >
                          {formatCents(tx.amount)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{typeLabels[tx.type] ?? tx.type}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <EntityHistory entityType="customer" entityId={id} />
    </div>
  )
}
