import { inferRouterOutputs } from "@trpc/server";

import { AppRouter } from "@/trpc/routers/_app";

export type GetAppointmentsForWeek =
  inferRouterOutputs<AppRouter>["appointments"]["getAppointmentsForWeek"];

export type GetPersonnelByAppointmentId =
  inferRouterOutputs<AppRouter>["customers"]["getPersonnelByAppointmentId"];

export type GetTransactionByAppointmentId =
  inferRouterOutputs<AppRouter>["transactions"]["getManyByAppointmentId"];

export type GetPersonnelOptions =
  inferRouterOutputs<AppRouter>["customers"]["getPersonnelByAppointmentId"];
