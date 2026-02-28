import { protectedProcedure, publicProcedure, router } from "../index";
import { customerRouter } from "./customer";
import { hairOrderRouter } from "./hair-order";
import { userRouter } from "./user";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
  privateData: protectedProcedure.query(({ ctx }) => {
    return {
      message: "This is private",
      user: ctx.session.user,
    };
  }),
  customer: customerRouter,
  hairOrder: hairOrderRouter,
  user: userRouter,
});
export type AppRouter = typeof appRouter;
