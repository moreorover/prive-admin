import { protectedProcedure, publicProcedure, router } from "../index"
import { appointmentRouter } from "./appointment"
import { customerRouter } from "./customer"
import { entityHistoryRouter } from "./entity-history"
import { hairOrderRouter } from "./hair-order"
import { transactionRouter } from "./transaction"

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK"
  }),
  privateData: protectedProcedure.query(({ ctx }) => {
    return {
      message: "This is private",
      user: ctx.session.user,
    }
  }),
  appointment: appointmentRouter,
  customer: customerRouter,
  entityHistory: entityHistoryRouter,
  hairOrder: hairOrderRouter,
  transaction: transactionRouter,
})
export type AppRouter = typeof appRouter
