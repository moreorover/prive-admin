import { createFileRoute } from "@tanstack/react-router";
import z from "zod";
import CustomerPage from "@/features/customers";

const customersSearchSchema = z.object({
  page: z.number().optional().catch(0),
  pageSize: z.number().optional().catch(10),
  sortBy: z.string().optional().catch(undefined),
  filter: z.string().optional().catch(undefined),
});

export type CustomersFilters = {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  filter?: string;
};

export const Route = createFileRoute("/_authenticated/dashboard/customers/")({
  component: CustomerPage,
  validateSearch: (search) => customersSearchSchema.parse(search),
  loaderDeps: ({ search }) => ({
    page: search.page,
    pageSize: search.pageSize,
    sortBy: search.sortBy,
    filter: search.filter,
  }),
  loader: async ({ context: { queryClient, trpc }, deps }) => {
    const filters = {
      page: deps.page,
      pageSize: deps.pageSize,
      sortBy: deps.sortBy,
      filter: deps.filter,
    };

    await queryClient.ensureQueryData(
      trpc.customer.getAll.queryOptions(filters),
    );
  },
});
