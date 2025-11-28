import { useQuery } from "@tanstack/react-query";
import { Main } from "@/components/layout/main";
import { ContactsDialogs } from "@/features/contacts/components/contacts-dialogs";
import { ContactsPrimaryButtons } from "@/features/contacts/components/contacts-primary-buttons";
import { ContactsProvider } from "@/features/contacts/components/contacts-provider";
import { ContactsTable } from "@/features/contacts/components/contacts-table";
import { Route } from "@/routes/_authenticated/dashboard/contacts/index";
import { trpc } from "@/utils/trpc";

export type ContactsFilters = {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  filter?: string;
};

export default function ContactPage() {
  const search = Route.useSearch();

  const filters: ContactsFilters = {
    page: search.page,
    pageSize: search.pageSize,
    sortBy: search.sortBy,
    filter: search.filter,
  };

  const contactsQuery = useQuery(trpc.contact.getAll.queryOptions(filters));
  const contacts = contactsQuery.data?.contacts || [];
  const pagination = contactsQuery.data?.pagination || {
    page: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 1,
  };

  const onSuccess = () => contactsQuery.refetch();

  return (
    <ContactsProvider>
      <Main className="flex flex-1 flex-col gap-4 sm:gap-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="font-bold text-2xl tracking-tight">Contacts</h2>
            <p className="text-muted-foreground">
              Here&apos;s a list of your contacts!
            </p>
          </div>
          <ContactsPrimaryButtons />
        </div>
        <ContactsTable data={contacts} pagination_data={pagination} />
      </Main>

      <ContactsDialogs onSuccess={onSuccess} />
    </ContactsProvider>
  );
}
