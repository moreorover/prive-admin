import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/utils/trpc";

export const Route = createFileRoute(
  "/_authenticated/dashboard/customers/$id/history",
)({
  component: CustomerHistory,
  loader: async ({ context: { queryClient, trpc }, params }) => {
    await queryClient.ensureQueryData(
      trpc.customer.getHistory.queryOptions({ customerId: params.id }),
    );

    return { crumb: "History" };
  },
});

function CustomerHistory() {
  const { id } = Route.useParams();

  const { data: customer } = useQuery(
    trpc.customer.getById.queryOptions({ customerId: id }),
  );

  const { data: history } = useQuery(
    trpc.customer.getHistory.queryOptions({ customerId: id }),
  );

  if (!customer) return null;

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <Button asChild variant="outline">
          <Link to="/dashboard/customers/$id" params={{ id }}>
            Overview
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/dashboard/customers/$id/history" params={{ id }}>
            History
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-muted-foreground text-sm">Name</div>
              <div className="font-medium">{customer.name}</div>
            </div>

            <div>
              <div className="text-muted-foreground text-sm">Phone Number</div>
              <div>{customer.phoneNumber || "N/A"}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change History</CardTitle>
        </CardHeader>
        <CardContent>
          {!history || history.length === 0 ? (
            <div className="text-muted-foreground text-sm">
              No changes recorded
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((record) => (
                <div key={record.id} className="border-muted border-l-2 pl-4">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {record.changedBy.name}
                      </span>
                      <Badge variant="secondary">
                        {record.changedBy.email}
                      </Badge>
                    </div>
                    <div className="text-muted-foreground text-sm">
                      {format(new Date(record.changedAt), "PPpp")}
                    </div>
                  </div>
                  <div className="space-y-1">
                    {Object.entries(
                      record.changes as Record<string, { old: any; new: any }>,
                    ).map(([field, change]) => (
                      <div key={field} className="text-sm">
                        <span className="font-medium capitalize">{field}:</span>{" "}
                        <span className="text-muted-foreground line-through">
                          {change.old || "empty"}
                        </span>{" "}
                        →{" "}
                        <span className="text-green-600">
                          {change.new || "empty"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
