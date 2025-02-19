import { inferRouterOutputs } from "@trpc/server";

import { AppRouter } from "@/trpc/routers/_app";

export type GetAllCustomers =
  inferRouterOutputs<AppRouter>["customers"]["getAll"];
