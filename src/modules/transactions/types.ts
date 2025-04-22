import type { inferRouterOutputs } from "@trpc/server";

import type { AppRouter } from "@/trpc/routers/_app";

export type GetAllTransactions =
	inferRouterOutputs<AppRouter>["transactions"]["getAll"];

export type GetTransactionsByAppointment =
	inferRouterOutputs<AppRouter>["transactions"]["getByAppointmentId"];
