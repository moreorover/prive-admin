import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { z } from "zod";
import { Main } from "@/components/layout/main";
import { ContactsDialogs } from "@/features/contacts/components/contacts-dialogs";
import { ContactsEditButtons } from "@/features/contacts/components/contacts-edit-buttons";
import { ContactsProvider } from "@/features/contacts/components/contacts-provider";
import { trpc } from "@/utils/trpc";

const contactSearchSchema = z.object({
  tab: z.enum(["overview", "history"]).optional(),
});

export const Route = createFileRoute("/_authenticated/dashboard/contacts/$id")(
  {
    component: ContactLayout,
    validateSearch: contactSearchSchema,
    loader: async ({ context: { queryClient, trpc }, params }) => {
      await queryClient.ensureQueryData(
        trpc.contact.getById.queryOptions({ contactId: params.id }),
      );

      const contact = queryClient.getQueryData(
        trpc.contact.getById.queryOptions({ contactId: params.id }).queryKey,
      );

      return {
        crumb: contact?.name || "Contact",
      };
    },
  },
);

function ContactLayout() {
  const { id } = Route.useParams();

  const contactQuery = useQuery(
    trpc.contact.getById.queryOptions({ contactId: id }),
  );

  if (!contactQuery.data) return <div>Contact not found</div>;

  return (
    <ContactsProvider>
      <Main className="flex flex-1 flex-col gap-4 p-6 sm:gap-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="font-bold text-2xl tracking-tight">
              {contactQuery.data.name}
            </h2>
            <p className="text-muted-foreground">
              Contact details and history
            </p>
          </div>
          <ContactsEditButtons contact={contactQuery.data} />
        </div>
        <Outlet />
      </Main>
      <ContactsDialogs onSuccess={() => contactQuery.refetch()} />
    </ContactsProvider>
  );
}
