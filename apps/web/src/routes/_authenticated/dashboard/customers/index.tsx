import { createFileRoute } from "@tanstack/react-router";
import z from "zod";
import CustomerPage from "@/features/customers";

const customersSearchSchema = z.object({
  page: z.number().optional().catch(0),
  pageSize: z.number().optional().catch(10),
  sortBy: z.string().optional().catch(undefined),
  name: z.string().optional().catch(undefined),
  phoneNumber: z.string().optional().catch(undefined),
});

export type CustomersFilters = {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  name?: string;
  phoneNumber?: string;
};

export const Route = createFileRoute("/_authenticated/dashboard/customers/")({
  component: CustomerPage,
  validateSearch: (search) => customersSearchSchema.parse(search),
  loaderDeps: ({ search }) => ({
    page: search.page,
    pageSize: search.pageSize,
    sortBy: search.sortBy,
    name: search.name,
    phoneNumber: search.phoneNumber,
  }),
  loader: async ({ context: { queryClient, trpc }, deps }) => {
    const filters = {
      page: deps.page,
      pageSize: deps.pageSize,
      sortBy: deps.sortBy,
      name: deps.name,
      phoneNumber: deps.phoneNumber,
    };

    await queryClient.ensureQueryData(
      trpc.customer.getAll.queryOptions(filters),
    );

    return {
      crumb: "Customers",
    };
  },
});
