import { db } from "@prive-admin/db";
import { customer, customerUser } from "@prive-admin/db/schema/customer";
import { user } from "@prive-admin/db/schema/auth";
import { and, desc, eq } from "drizzle-orm";
import z from "zod";

import { protectedProcedure, router } from "../index";

export const customerRouter = router({
  getAll: protectedProcedure.query(async () => {
    return db
      .select({
        id: customer.id,
        name: customer.name,
        email: customer.email,
        createdAt: customer.createdAt,
      })
      .from(customer)
      .orderBy(desc(customer.createdAt));
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const [row] = await db
        .select({
          id: customer.id,
          name: customer.name,
          email: customer.email,
          createdAt: customer.createdAt,
        })
        .from(customer)
        .where(eq(customer.id, input.id));

      if (!row) return null;

      const assignedUsers = await db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
        })
        .from(customerUser)
        .innerJoin(user, eq(customerUser.userId, user.id))
        .where(eq(customerUser.customerId, input.id));

      return { ...row, users: assignedUsers };
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        email: z.string().email(),
      }),
    )
    .mutation(async ({ input }) => {
      const [row] = await db
        .insert(customer)
        .values({
          name: input.name,
          email: input.email,
        })
        .returning();

      return row;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1),
        email: z.string().email(),
      }),
    )
    .mutation(async ({ input }) => {
      const [row] = await db
        .update(customer)
        .set({
          name: input.name,
          email: input.email,
        })
        .where(eq(customer.id, input.id))
        .returning();

      return row;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await db.delete(customer).where(eq(customer.id, input.id));
    }),

  assignUser: protectedProcedure
    .input(
      z.object({
        customerId: z.string(),
        userId: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      await db
        .insert(customerUser)
        .values({
          customerId: input.customerId,
          userId: input.userId,
        })
        .onConflictDoNothing();
    }),

  unassignUser: protectedProcedure
    .input(
      z.object({
        customerId: z.string(),
        userId: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      await db
        .delete(customerUser)
        .where(
          and(
            eq(customerUser.customerId, input.customerId),
            eq(customerUser.userId, input.userId),
          ),
        );
    }),
});
