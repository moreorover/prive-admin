import type { inferRouterOutputs } from "@trpc/server";

import type { AppRouter } from "@/trpc/routers/_app";

export type GetAllHairSales =
	inferRouterOutputs<AppRouter>["hairSales"]["getAll"];

export type GetHairAssignmentsToSale =
	inferRouterOutputs<AppRouter>["hairSales"]["getHairAssignments"];
