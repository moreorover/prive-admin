import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { z } from "zod";
import { Main } from "@/components/layout/main";
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

  const { data: customer } = useQuery(
    trpc.customer.getById.queryOptions({ customerId: id }),
  );

  if (!customer) return <div>Customer not found</div>;

  return (
    <Main className="flex flex-1 flex-col gap-4 p-6 sm:gap-6">
      <div>
        <h2 className="font-bold text-2xl tracking-tight">{customer.name}</h2>
        <p className="text-muted-foreground">Customer details and history</p>
      </div>

      <Outlet />
    </Main>
  );
}
