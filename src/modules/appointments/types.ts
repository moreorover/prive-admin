import type { AppRouter } from "@/server/root";
import type { inferRouterOutputs } from "@trpc/server";

export type GetPersonnelOptions =
	inferRouterOutputs<AppRouter>["customers"]["getPersonnelByAppointmentId"];

export type GetAppointments =
	inferRouterOutputs<AppRouter>["appointments"]["getAppointmentsBetweenDates"];
