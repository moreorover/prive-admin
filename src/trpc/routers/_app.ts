import { appointmentNotesRouter } from "@/modules/appointment_notes/server/procedures";
import { appointmentsRouter } from "@/modules/appointments/server/procedures";
import { customersRouter } from "@/modules/customers/server/procedures";
import { hairOrderNotesRouter } from "@/modules/hair_order_notes/server/procedures";
import { hairOrderRouter } from "@/modules/hair_orders/server/procedures";
import { transactionsRouter } from "@/modules/transactions/server/procedures";
import { createTRPCRouter } from "@/trpc/init";
import { hairAssignedRouter } from "@/trpc/routers/hairAssigned";
import { notesRouter } from "@/trpc/routers/notes";

export const appRouter = createTRPCRouter({
	appointments: appointmentsRouter,
	appointmentNotes: appointmentNotesRouter,
	customers: customersRouter,
	hairOrders: hairOrderRouter,
	hairAssigned: hairAssignedRouter,
	hairOrderNotes: hairOrderNotesRouter,
	notes: notesRouter,
	transactions: transactionsRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;
