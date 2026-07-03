import { publicProcedure, router } from "../index"
import { sessionRouter } from "./session"

export const appRouter = router({
  healthCheck: publicProcedure.query(() => "OK"),
  session: sessionRouter,
})

export type AppRouter = typeof appRouter
