import { publicProcedure, router } from "../index"
import { appointmentsRouter } from "./appointments"
import { customersRouter } from "./customers"
import { hairAssignedRouter } from "./hair-assigned"
import { hairOrdersRouter } from "./hair-orders"
import { sessionRouter } from "./session"
import { transactionsRouter } from "./transactions"
import { userSettingsRouter } from "./user-settings"

export const appRouter = router({
  appointments: appointmentsRouter,
  customers: customersRouter,
  hairAssigned: hairAssignedRouter,
  hairOrders: hairOrdersRouter,
  healthCheck: publicProcedure.query(() => "OK"),
  session: sessionRouter,
  transactions: transactionsRouter,
  userSettings: userSettingsRouter,
})

export type AppRouter = typeof appRouter
