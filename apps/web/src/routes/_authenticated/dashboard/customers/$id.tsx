import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { z } from "zod";
import { Main } from "@/components/layout/main";
import { CustomersDialogs } from "@/features/customers/components/customers-dialogs";
import { CustomersEditButtons } from "@/features/customers/components/customers-edit-buttons";
import { CustomersProvider } from "@/features/customers/components/customers-provider";
import { trpc } from "@/utils/trpc";

const customerSearchSchema = z.object({
  tab: z.enum(["overview", "history"]).optional(),
});

export const Route = createFileRoute("/_authenticated/dashboard/customers/$id")(
  {
    component: CustomerLayout,
    validateSearch: customerSearchSchema,
    loader: async ({ context: { queryClient, trpc }, params }) => {
      await queryClient.ensureQueryData(
        trpc.customer.getById.queryOptions({ customerId: params.id }),
      );

      const customer = queryClient.getQueryData(
        trpc.customer.getById.queryOptions({ customerId: params.id }).queryKey,
      );

      return {
        crumb: customer?.name || "Customer",
      };
    },
  },
);

function CustomerLayout() {
  const { id } = Route.useParams();

  const customerQuery = useQuery(
    trpc.customer.getById.queryOptions({ customerId: id }),
  );

  if (!customerQuery.data) return <div>Customer not found</div>;

  return (
    <CustomersProvider>
      <Main className="flex flex-1 flex-col gap-4 p-6 sm:gap-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="font-bold text-2xl tracking-tight">
              {customerQuery.data.name}
            </h2>
            <p className="text-muted-foreground">
              Customer details and history
            </p>
          </div>
          <CustomersEditButtons customer={customerQuery.data} />
        </div>
        <Outlet />
      </Main>
      <CustomersDialogs onSuccess={() => customerQuery.refetch()} />
    </CustomersProvider>
  );
}
