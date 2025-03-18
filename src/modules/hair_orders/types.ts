import { inferRouterOutputs } from "@trpc/server";

import { AppRouter } from "@/trpc/routers/_app";

export type GetAllHairOrders =
  inferRouterOutputs<AppRouter>["hairOrders"]["getAll"];

export type HairOrderNotes =
  inferRouterOutputs<AppRouter>["hairOrderNotes"]["getNotesByHairOrderId"];

export type HairOrderTransactions =
  inferRouterOutputs<AppRouter>["transactions"]["getByHairOrderId"];

export type HairOrderHair =
  inferRouterOutputs<AppRouter>["hair"]["getByHairOrderId"];

export type Hairs = inferRouterOutputs<AppRouter>["hair"]["getAll"];
