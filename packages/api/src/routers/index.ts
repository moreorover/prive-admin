import { protectedProcedure, publicProcedure, router } from "../index";
import { hairOrderRouter } from "./hair-order";
import { todoRouter } from "./todo";
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
  hairOrder: hairOrderRouter,
  todo: todoRouter,
  user: userRouter,
});
export type AppRouter = typeof appRouter;
