import { db } from "@prive-admin/db";
import { entityHistory } from "@prive-admin/db/schema/entity-history";
import { user } from "@prive-admin/db/schema/auth";
import { desc, eq, and } from "drizzle-orm";
import z from "zod";

import { protectedProcedure, router } from "../index";

export const entityHistoryRouter = router({
  getByEntity: protectedProcedure
    .input(
      z.object({
        entityType: z.enum(["customer", "hair_order"]),
        entityId: z.string(),
      }),
    )
    .query(async ({ input }) => {
      return db
        .select({
          id: entityHistory.id,
          entityType: entityHistory.entityType,
          entityId: entityHistory.entityId,
          fieldName: entityHistory.fieldName,
          oldValue: entityHistory.oldValue,
          newValue: entityHistory.newValue,
          changedAt: entityHistory.changedAt,
          changedById: entityHistory.changedById,
          changedByName: user.name,
        })
        .from(entityHistory)
        .leftJoin(user, eq(entityHistory.changedById, user.id))
        .where(
          and(
            eq(entityHistory.entityType, input.entityType),
            eq(entityHistory.entityId, input.entityId),
          ),
        )
        .orderBy(desc(entityHistory.changedAt));
    }),
});
