import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/utils/trpc";

export const Route = createFileRoute(
  "/_authenticated/dashboard/contacts/$id/",
)({
  component: ContactOverview,
});

function ContactOverview() {
  const { id } = Route.useParams();

  const { data: contact } = useQuery(
    trpc.contact.getById.queryOptions({ contactId: id }),
  );

  if (!contact) return null;

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <Button asChild variant="outline">
          <Link to="/dashboard/contacts/$id" params={{ id }}>
            Overview
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/dashboard/contacts/$id/history" params={{ id }}>
            History
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contact Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-muted-foreground text-sm">Name</div>
            <div className="font-medium text-lg">{contact.name}</div>
          </div>

          <div>
            <div className="text-muted-foreground text-sm">Phone Number</div>
            <div className="text-lg">{contact.phoneNumber || "N/A"}</div>
          </div>

          <Separator />

          <div>
            <div className="text-muted-foreground text-sm">Created By</div>
            <div className="flex items-center gap-2">
              <span>{contact.createdBy.name}</span>
              <Badge variant="outline">{contact.createdBy.email}</Badge>
            </div>
          </div>

          <div>
            <div className="text-muted-foreground text-sm">Created At</div>
            <div>{format(new Date(contact.createdAt), "PPpp")}</div>
          </div>

          <div>
            <div className="text-muted-foreground text-sm">Last Updated</div>
            <div>{format(new Date(contact.updatedAt), "PPpp")}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
