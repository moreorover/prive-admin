import { inferRouterOutputs } from "@trpc/server";

import { AppRouter } from "@/trpc/routers/_app";

export type GetAllProducts =
  inferRouterOutputs<AppRouter>["products"]["getAll"];
