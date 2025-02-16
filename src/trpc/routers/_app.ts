import { appointmentsRouter } from "@/modules/appointments/server/procedures";
import { transactionsRouter } from "@/modules/transactions/server/procedures";

import { createTRPCRouter } from "@/trpc/init";

export const appRouter = createTRPCRouter({
  appointments: appointmentsRouter,
  transactions: transactionsRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;
