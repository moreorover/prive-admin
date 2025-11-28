import { publicProcedure, router } from "../index";
import { bookingRouter } from "./booking";
import { contactRouter } from "./contact";
import { entityHistoryRouter } from "./entityHistory";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
  booking: bookingRouter,
  contact: contactRouter,
  entityHistory: entityHistoryRouter,
});
export type AppRouter = typeof appRouter;
