import { db } from "@prive-admin-tanstack/db"
import { legalEntity } from "@prive-admin-tanstack/db/schema/legal-entity"
import { TRPCError } from "@trpc/server"
import { eq } from "drizzle-orm"
import { z } from "zod"

import { protectedProcedure, router } from "../index"

const legalEntityUpdateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, "Name is required").max(120),
  registrationNumber: z.string().max(40).nullish(),
  vatNumber: z.string().max(40).nullish(),
})

export const legalEntitiesRouter = router({
  list: protectedProcedure.input(z.object({}).optional().default({})).query(() => {
    return db.query.legalEntity.findMany({
      orderBy: (le, { asc }) => [asc(le.country), asc(le.name)],
    })
  }),

  get: protectedProcedure.input(z.object({ id: z.string().min(1) })).query(async ({ input }) => {
    const result = await db.query.legalEntity.findFirst({
      where: eq(legalEntity.id, input.id),
      with: {
        bankAccounts: { orderBy: (a, { asc }) => [asc(a.displayName)] },
      },
    })
    if (!result) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Legal entity not found" })
    }
    return result
  }),

  update: protectedProcedure.input(legalEntityUpdateSchema).mutation(async ({ input }) => {
    const [result] = await db
      .update(legalEntity)
      .set({
        name: input.name,
        registrationNumber: input.registrationNumber ?? null,
        vatNumber: input.vatNumber ?? null,
      })
      .where(eq(legalEntity.id, input.id))
      .returning()
    if (!result) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Legal entity not found" })
    }
    return result
  }),
})
