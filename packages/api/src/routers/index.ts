import { publicProcedure, router } from "../index";
import { bookingRouter } from "./booking";
import { customerRouter } from "./customer";
import { entityHistoryRouter } from "./entityHistory";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
  booking: bookingRouter,
  customer: customerRouter,
  entityHistory: entityHistoryRouter,
});
export type AppRouter = typeof appRouter;
