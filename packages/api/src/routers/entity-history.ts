import { db } from "@prive-admin/db";
import { entityHistory } from "@prive-admin/db/schema/entity-history";
import { user } from "@prive-admin/db/schema/auth";
import { customer } from "@prive-admin/db/schema/customer";
import { hairOrder } from "@prive-admin/db/schema/hair-order";
import { desc, eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import z from "zod";

import { protectedProcedure, router } from "../index";
import { recordChanges } from "../lib/entity-history";

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

  revert: protectedProcedure
    .input(z.object({ historyId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const [entry] = await db
        .select()
        .from(entityHistory)
        .where(eq(entityHistory.id, input.historyId));

      if (!entry) {
        throw new TRPCError({ code: "NOT_FOUND", message: "History entry not found" });
      }

      if (entry.fieldName === "deleted") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot revert a deletion" });
      }

      const revertValue = entry.oldValue;

      if (entry.entityType === "customer") {
        const field = entry.fieldName as "name" | "email";
        const [existing] = await db
          .select({ [field]: customer[field] })
          .from(customer)
          .where(eq(customer.id, entry.entityId));

        if (!existing) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Customer not found" });
        }

        await db
          .update(customer)
          .set({ [field]: revertValue })
          .where(eq(customer.id, entry.entityId));

        await recordChanges({
          entityType: "customer",
          entityId: entry.entityId,
          changedById: ctx.session.user.id,
          oldValues: existing,
          newValues: { [field]: revertValue },
        });
      } else {
        const field = entry.fieldName as
          | "placedAt"
          | "arrivedAt"
          | "customerId"
          | "weightReceived"
          | "total";

        const [existing] = await db
          .select({ [field]: hairOrder[field] })
          .from(hairOrder)
          .where(eq(hairOrder.id, entry.entityId));

        if (!existing) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Hair order not found" });
        }

        let coerced: string | number | Date | null;
        if (field === "placedAt" || field === "arrivedAt") {
          coerced = revertValue ? new Date(revertValue) : null;
        } else if (field === "weightReceived" || field === "total") {
          coerced = revertValue ? Number(revertValue) : 0;
        } else {
          coerced = revertValue;
        }

        await db
          .update(hairOrder)
          .set({ [field]: coerced })
          .where(eq(hairOrder.id, entry.entityId));

        await recordChanges({
          entityType: "hair_order",
          entityId: entry.entityId,
          changedById: ctx.session.user.id,
          oldValues: existing,
          newValues: { [field]: coerced },
        });
      }
    }),
});
