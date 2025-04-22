import type { inferRouterOutputs } from "@trpc/server";

import type { AppRouter } from "@/trpc/routers/_app";

export type GetAllHairOrders =
	inferRouterOutputs<AppRouter>["hairOrders"]["getAll"];

export type HairOrderNotes =
	inferRouterOutputs<AppRouter>["hairOrderNotes"]["getNotesByHairOrderId"];

export type HairOrderTransactions =
	inferRouterOutputs<AppRouter>["transactions"]["getByHairOrderId"];
