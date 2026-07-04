import { db } from "@prive-admin-tanstack/db"
import { salon } from "@prive-admin-tanstack/db/schema/salon"
import { TRPCError } from "@trpc/server"
import { eq } from "drizzle-orm"
import { z } from "zod"

import { protectedProcedure, router } from "../index"

const salonSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required").max(120),
  address: z.string().max(255).nullish(),
})

export const salonsRouter = router({
  list: protectedProcedure.query(() => {
    return db.query.salon.findMany({
      orderBy: (s, { asc }) => [asc(s.name)],
    })
  }),

  byId: protectedProcedure.input(z.object({ id: z.string().min(1) })).query(async ({ input }) => {
    const result = await db.query.salon.findFirst({ where: eq(salon.id, input.id) })
    if (!result) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Salon not found" })
    }
    return result
  }),

  create: protectedProcedure.input(salonSchema).mutation(async ({ input }) => {
    const [result] = await db
      .insert(salon)
      .values({ name: input.name, address: input.address ?? null })
      .returning()
    return result
  }),

  update: protectedProcedure.input(salonSchema.required({ id: true })).mutation(async ({ input }) => {
    const [result] = await db
      .update(salon)
      .set({ name: input.name, address: input.address ?? null })
      .where(eq(salon.id, input.id))
      .returning()
    if (!result) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Salon not found" })
    }
    return result
  }),
})
