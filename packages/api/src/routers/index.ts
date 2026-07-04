import { publicProcedure, router } from "../index"
import { appointmentsRouter } from "./appointments"
import { customersRouter } from "./customers"
import { sessionRouter } from "./session"
import { transactionsRouter } from "./transactions"
import { userSettingsRouter } from "./user-settings"

export const appRouter = router({
  appointments: appointmentsRouter,
  customers: customersRouter,
  healthCheck: publicProcedure.query(() => "OK"),
  session: sessionRouter,
  transactions: transactionsRouter,
  userSettings: userSettingsRouter,
})

export type AppRouter = typeof appRouter
