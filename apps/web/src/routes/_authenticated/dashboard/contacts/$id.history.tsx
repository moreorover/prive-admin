import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { EntityHistoryCard } from "@/components/entity-history-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/utils/trpc";

export const Route = createFileRoute(
  "/_authenticated/dashboard/contacts/$id/history",
)({
  component: ContactHistory,
  loader: async ({ context: { queryClient, trpc }, params }) => {
    await queryClient.ensureQueryData(
      trpc.entityHistory.getHistory.queryOptions({
        entityType: "contact",
        entityId: params.id,
      }),
    );

    return { crumb: "History" };
  },
});

function ContactHistory() {
  const { id } = Route.useParams();

  const { data: contact } = useQuery(
    trpc.contact.getById.queryOptions({ contactId: id }),
  );

  const { data: history } = useQuery(
    trpc.entityHistory.getHistory.queryOptions({
      entityType: "contact",
      entityId: id,
    }),
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-muted-foreground text-sm">Name</div>
              <div className="font-medium">{contact.name}</div>
            </div>

            <div>
              <div className="text-muted-foreground text-sm">Phone Number</div>
              <div>{contact.phoneNumber || "N/A"}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <EntityHistoryCard history={history} />
    </div>
  );
}
