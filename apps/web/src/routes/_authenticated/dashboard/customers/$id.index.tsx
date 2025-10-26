import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/utils/trpc";

export const Route = createFileRoute(
  "/_authenticated/dashboard/customers/$id/",
)({
  component: CustomerOverview,
});

function CustomerOverview() {
  const { id } = Route.useParams();

  const { data: customer } = useQuery(
    trpc.customer.getById.queryOptions({ customerId: id }),
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
    </div>
  );
}
