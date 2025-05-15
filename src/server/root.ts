import { appointmentsRouter } from "@/modules/appointments/server/procedures";
import { customersRouter } from "@/modules/customers/server/procedures";
import { hairOrderRouter } from "@/modules/hair_orders/server/procedures";
import { transactionsRouter } from "@/modules/transactions/server/procedures";
import { dashboardRouter } from "@/server/routers/dashboard";
import { hairAssignedRouter } from "@/server/routers/hairAssigned";
import { notesRouter } from "@/server/routers/notes";
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
