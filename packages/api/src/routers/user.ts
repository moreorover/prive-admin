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
});
