import { inferRouterOutputs } from "@trpc/server";

import { AppRouter } from "@/trpc/routers/_app";

export type GetAllHairInStock =
  inferRouterOutputs<AppRouter>["hair"]["getInStock"];
