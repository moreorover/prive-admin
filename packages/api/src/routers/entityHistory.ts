import z from "zod";
import { protectedProcedure, router } from "../index";
import { getEntityHistory } from "../lib/history";

export const entityHistoryRouter = router({
  getHistory: protectedProcedure
    .input(
      z.object({
        entityType: z.enum([
          "customer",
          "booking",
          "hair_order",
          "hair_assigned",
        ]),
        entityId: z.string(),
      }),
    )
    .query(async ({ input }) => {
      return getEntityHistory(input.entityType, input.entityId);
    }),
});
