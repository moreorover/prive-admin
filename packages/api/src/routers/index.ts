import { publicProcedure, router } from "../index"
import { customersRouter } from "./customers"
import { sessionRouter } from "./session"

export const appRouter = router({
  customers: customersRouter,
  healthCheck: publicProcedure.query(() => "OK"),
  session: sessionRouter,
})

export type AppRouter = typeof appRouter
