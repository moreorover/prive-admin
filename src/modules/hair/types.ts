import { inferRouterOutputs } from "@trpc/server";

import { AppRouter } from "@/trpc/routers/_app";

export type GetAllHairOptions =
  inferRouterOutputs<AppRouter>["hair"]["getHairComponentOptionsForHairId"];

export type GetHairComponents =
  inferRouterOutputs<AppRouter>["hair"]["getHairComponentsByHairId"];
