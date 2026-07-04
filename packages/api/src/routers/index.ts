import { publicProcedure, router } from "../index"
import { appointmentsRouter } from "./appointments"
import { cashTransactionsRouter } from "./cash-transactions"
import { customersRouter } from "./customers"
import { dashboardRouter } from "./dashboard"
import { hairAssignedRouter } from "./hair-assigned"
import { hairOrdersRouter } from "./hair-orders"
import { legalEntitiesRouter } from "./legal-entities"
import { notesRouter } from "./notes"
import { salonsRouter } from "./salons"
import { sessionRouter } from "./session"
import { transactionsRouter } from "./transactions"
import { userSettingsRouter } from "./user-settings"

export const appRouter = router({
  appointments: appointmentsRouter,
  cashTransactions: cashTransactionsRouter,
  customers: customersRouter,
  dashboard: dashboardRouter,
  hairAssigned: hairAssignedRouter,
  hairOrders: hairOrdersRouter,
  healthCheck: publicProcedure.query(() => "OK"),
  legalEntities: legalEntitiesRouter,
  notes: notesRouter,
  salons: salonsRouter,
  session: sessionRouter,
  transactions: transactionsRouter,
  userSettings: userSettingsRouter,
})

export type AppRouter = typeof appRouter
