import { router, publicProcedure } from "../index"

export const sessionRouter = router({
  current: publicProcedure.query(({ ctx }) => ctx.session),
})
