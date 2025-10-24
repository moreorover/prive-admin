import { useQuery } from "@tanstack/react-query";
import { Main } from "@/components/layout/main";
import { CustomersDialogs } from "@/features/customers/components/customers-dialogs";
import { CustomersPrimaryButtons } from "@/features/customers/components/customers-primary-buttons";
import { CustomersProvider } from "@/features/customers/components/customers-provider";
import { CustomersTable } from "@/features/customers/components/customers-table";
import {
  type CustomersFilters,
  Route,
} from "@/routes/_authenticated/dashboard/customers";
import { trpc } from "@/utils/trpc";

export default function CustomerPage() {
  const search = Route.useSearch();

  const filters: CustomersFilters = {
    page: search.page,
    pageSize: search.pageSize,
    sortBy: search.sortBy,
    filter: search.filter,
  };

  const customersQuery = useQuery(trpc.customer.getAll.queryOptions(filters));
  const customers = customersQuery.data?.customers || [];
  const pagination = customersQuery.data?.pagination;

  const onSuccess = () => customersQuery.refetch();

  return (
    <CustomersProvider>
      <Main className="flex flex-1 flex-col gap-4 sm:gap-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="font-bold text-2xl tracking-tight">Tasks</h2>
            <p className="text-muted-foreground">
              Here&apos;s a list of your tasks for this month!
            </p>
          </div>
          <CustomersPrimaryButtons />
        </div>
        <CustomersTable data={customers} pagination_data={pagination} />
      </Main>

      <CustomersDialogs onSuccess={onSuccess} />
    </CustomersProvider>
  );
}
