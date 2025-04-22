import type { inferRouterOutputs } from "@trpc/server";

import type { AppRouter } from "@/trpc/routers/_app";

export type GetAllCustomers =
	inferRouterOutputs<AppRouter>["customers"]["getAll"];

export type GetAppointmentsByCustomer =
	inferRouterOutputs<AppRouter>["appointments"]["getAppointmentsByCustomerId"];
