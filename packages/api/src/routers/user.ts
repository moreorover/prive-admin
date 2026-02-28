import { db } from "@prive-admin/db";
import { user } from "@prive-admin/db/schema/auth";
import { desc, eq } from "drizzle-orm";
import z from "zod";

import { protectedProcedure, router } from "../index";

export const userRouter = router({
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      const [row] = await db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
        })
        .from(user)
        .where(eq(user.id, input.id));

      return row ?? null;
    }),

  getAll: protectedProcedure.query(async () => {
    return db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      })
      .from(user)
      .orderBy(desc(user.createdAt));
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
        .insert(user)
        .values({
          id: crypto.randomUUID(),
          name: input.name,
          email: input.email,
          role: "guest",
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
        .update(user)
        .set({
          name: input.name,
          email: input.email,
        })
        .where(eq(user.id, input.id))
        .returning();

      return row;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await db.delete(user).where(eq(user.id, input.id));
    }),
});
