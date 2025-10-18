import { createFileRoute } from "@tanstack/react-router";
import z from "zod";
import CustomerPage from "@/features/customers";

const customersSearchSchema = z.object({
  page: z.number().optional(),
  pageSize: z.number().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.union([z.literal("asc"), z.literal("desc"), z.undefined()]),
  name: z.string().optional(),
  phoneNumber: z.string().optional(),
});

export type CustomersFilters = {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  name?: string;
  phoneNumber?: string;
};

export const Route = createFileRoute("/_authenticated/dashboard/customers")({
  component: CustomerPage,
  validateSearch: (search) => customersSearchSchema.parse(search),
  loaderDeps: ({ search }) => ({
    page: search.page,
    pageSize: search.pageSize,
    sortBy: search.sortBy,
    sortOrder: search.sortOrder,
    name: search.name,
    phoneNumber: search.phoneNumber,
  }),
  loader: async ({ context: { queryClient, trpc }, deps }) => {
    const filters = {
      page: deps.page,
      pageSize: deps.pageSize,
      sortBy: deps.sortBy,
      sortOrder: deps.sortOrder,
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
