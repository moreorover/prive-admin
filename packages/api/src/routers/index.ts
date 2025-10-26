import { publicProcedure, router } from "../index";
import { customerRouter } from "./customer";
import { entityHistoryRouter } from "./entityHistory";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
  customer: customerRouter,
  entityHistory: entityHistoryRouter,
});
export type AppRouter = typeof appRouter;
