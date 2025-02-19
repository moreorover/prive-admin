import { inferRouterOutputs } from "@trpc/server";

import { AppRouter } from "@/trpc/routers/_app";

export type GetAppointmentsForWeek =
  inferRouterOutputs<AppRouter>["appointments"]["getAppointmentsForWeek"];
