import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/utils/trpc";

export const Route = createFileRoute("/_authenticated/dashboard/customers/$id")(
  {
    component: CustomerPage,
    loader: async ({ context: { queryClient, trpc }, params }) => {
      await queryClient.ensureQueryData(
        trpc.customer.getById.queryOptions({ customerId: params.id }),
      );

      await queryClient.ensureQueryData(
        trpc.customer.getHistory.queryOptions({ customerId: params.id }),
      );

      return {
        crumb: "Customers",
      };
    },
  },
);

function CustomerPage() {
  const { id } = Route.useParams();

  const { data: customer } = useQuery(
    trpc.customer.getById.queryOptions({ customerId: id }),
  );
  const { data: history } = useQuery(
    trpc.customer.getHistory.queryOptions({ customerId: id }),
  );

  if (!customer) return <div>Customer not found</div>;

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Customer Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-muted-foreground text-sm">Name</div>
            <div className="font-medium text-lg">{customer.name}</div>
          </div>

          <div>
            <div className="text-muted-foreground text-sm">Phone Number</div>
            <div className="text-lg">{customer.phoneNumber || "N/A"}</div>
          </div>

          <Separator />

          <div>
            <div className="text-muted-foreground text-sm">Created By</div>
            <div className="flex items-center gap-2">
              <span>{customer.createdBy.name}</span>
              <Badge variant="outline">{customer.createdBy.email}</Badge>
            </div>
          </div>

          <div>
            <div className="text-muted-foreground text-sm">Created At</div>
            <div>{format(new Date(customer.createdAt), "PPpp")}</div>
          </div>

          <div>
            <div className="text-muted-foreground text-sm">Last Updated</div>
            <div>{format(new Date(customer.updatedAt), "PPpp")}</div>
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
