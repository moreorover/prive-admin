import { publicProcedure, router } from "../index";
import { bookingRouter } from "./booking";
import { contactRouter } from "./contact";
import { entityHistoryRouter } from "./entityHistory";
import { versionRouter } from "./version";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return "OK";
  }),
  version: versionRouter,
  booking: bookingRouter,
  contact: contactRouter,
  entityHistory: entityHistoryRouter,
});
export type AppRouter = typeof appRouter;
