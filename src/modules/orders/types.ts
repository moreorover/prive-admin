import { inferRouterOutputs } from "@trpc/server";

import { AppRouter } from "@/trpc/routers/_app";

export type GetAllOrders = inferRouterOutputs<AppRouter>["orders"]["getAll"];

export type GetOrderTransactions =
  inferRouterOutputs<AppRouter>["transactions"]["getByOrderId"];
