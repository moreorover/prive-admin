import { appointmentsRouter } from "@/server/routers/appointments";
import { customersRouter } from "@/server/routers/customers";
import { dashboardRouter } from "@/server/routers/dashboard";
import { hairOrderRouter } from "@/server/routers/hair-orders";
import { hairAssignedRouter } from "@/server/routers/hairAssigned";
import { notesRouter } from "@/server/routers/notes";
import { transactionsRouter } from "@/server/routers/transactions";

import { createCallerFactory, createTRPCRouter } from "@/server/trpc";

export const appRouter = createTRPCRouter({
	appointments: appointmentsRouter,
	customers: customersRouter,
	dashboard: dashboardRouter,
	hairOrders: hairOrderRouter,
	hairAssigned: hairAssignedRouter,
	notes: notesRouter,
	transactions: transactionsRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
