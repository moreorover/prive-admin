import type { AppRouter } from "@/server/root";
import type { inferRouterOutputs } from "@trpc/server";

export type GetAllTransactions =
	inferRouterOutputs<AppRouter>["transactions"]["getAll"];
