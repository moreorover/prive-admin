import { inferRouterOutputs } from "@trpc/server";

import { AppRouter } from "@/trpc/routers/_app";

export type GetAllTransactions =
  inferRouterOutputs<AppRouter>["transactions"]["getAll"];

export type GetAllTransactionsWithAllocations =
  inferRouterOutputs<AppRouter>["transactions"]["getAllTransactionsWithAllocations"];
