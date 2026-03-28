import { Badge } from "@prive-admin-tanstack/ui/components/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@prive-admin-tanstack/ui/components/card"
import { Separator } from "@prive-admin-tanstack/ui/components/separator"
import { Skeleton } from "@prive-admin-tanstack/ui/components/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@prive-admin-tanstack/ui/components/table"
import { useQuery, queryOptions } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"
import { ArrowLeft, User } from "lucide-react"

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

function HairOrderDetailPage() {
  const { hairOrderId } = Route.useParams()

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
          <CardHeader>
            <CardTitle className="text-sm">Hair Assigned</CardTitle>
          </CardHeader>
          <CardContent>
            {hairOrder.hairAssigned && hairOrder.hairAssigned.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead>Sold For</TableHead>
                    <TableHead>Profit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hairOrder.hairAssigned.map((ha) => (
                    <TableRow key={ha.id}>
                      <TableCell>{ha.client?.name ?? "—"}</TableCell>
                      <TableCell>{ha.weightInGrams}g</TableCell>
                      <TableCell>{formatCents(ha.soldFor)}</TableCell>
                      <TableCell>{formatCents(ha.profit)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">No hair assigned yet.</p>
            )}
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
    </div>
  )
}
