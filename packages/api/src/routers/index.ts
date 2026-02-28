import { protectedProcedure, publicProcedure, router } from "../index"
import { customerRouter } from "./customer"
import { entityHistoryRouter } from "./entity-history"
import { hairOrderRouter } from "./hair-order"

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
  customer: customerRouter,
  entityHistory: entityHistoryRouter,
  hairOrder: hairOrderRouter,
})
export type AppRouter = typeof appRouter
