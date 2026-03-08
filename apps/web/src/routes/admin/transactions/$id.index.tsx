import { useQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { format } from "date-fns"
import { PencilIcon } from "lucide-react"

import { EntityHistory } from "@/components/entity-history"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { trpc } from "@/utils/trpc"

export const Route = createFileRoute("/admin/transactions/$id/")({
  staticData: { title: "View Transaction" },
  component: ViewTransactionPage,
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

function ViewTransactionPage() {
  const { id } = Route.useParams()

  const txQuery = useQuery(trpc.transaction.getById.queryOptions({ id }))

  if (txQuery.isLoading) {
    return <div className="text-center text-muted-foreground">Loading...</div>
  }

  if (!txQuery.data) {
    return <div className="text-center text-muted-foreground">Transaction not found.</div>
  }

  const tx = txQuery.data

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Transaction</CardTitle>
          <Button asChild size="sm" variant="outline">
            <Link to="/admin/transactions/$id/edit" params={{ id }}>
              <PencilIcon className="mr-2 size-4" />
              Edit
            </Link>
          </Button>
        </CardHeader>

        <CardContent>
          <dl className="divide-y">
            <DetailRow label="Amount">
              <span
                className={
                  tx.amount >= 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }
              >
                {formatCents(tx.amount)}
              </span>
            </DetailRow>

            <DetailRow label="Type">
              <Badge variant="outline">{typeLabels[tx.type] ?? tx.type}</Badge>
            </DetailRow>

            {tx.description && (
              <DetailRow label="Description">
                <p className="whitespace-pre-wrap">{tx.description}</p>
              </DetailRow>
            )}

            <DetailRow label="Date">
              {format(new Date(tx.date), "dd MMM yyyy")}
            </DetailRow>

            <DetailRow label="Customer">
              {tx.customerName ? (
                <Link
                  to="/admin/customers/$id/edit"
                  params={{ id: tx.customerId }}
                  className="text-primary hover:underline"
                >
                  {tx.customerName}
                </Link>
              ) : (
                "—"
              )}
            </DetailRow>

            {tx.appointmentId && (
              <DetailRow label="Appointment">
                <Link
                  to="/admin/appointments/$id"
                  params={{ id: tx.appointmentId }}
                  className="text-primary hover:underline"
                >
                  {tx.appointmentName ?? tx.appointmentId}
                </Link>
              </DetailRow>
            )}

            {tx.hairOrderId && (
              <DetailRow label="Hair Order">
                <Link
                  to="/admin/hair-orders/$id/edit"
                  params={{ id: tx.hairOrderId }}
                  className="text-primary hover:underline"
                >
                  #{tx.hairOrderUid}
                </Link>
              </DetailRow>
            )}

            <DetailRow label="Created by">
              {tx.createdByName ?? "—"}
            </DetailRow>

            <DetailRow label="Created at">
              {format(new Date(tx.createdAt), "dd MMM yyyy, HH:mm")}
            </DetailRow>
          </dl>
        </CardContent>
      </Card>

      <EntityHistory entityType="transaction" entityId={id} />
    </div>
  )
}
