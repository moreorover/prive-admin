import { publicProcedure, router } from "../index";
import { customerRouter } from "./customer";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
  customer: customerRouter,
});
export type AppRouter = typeof appRouter;
