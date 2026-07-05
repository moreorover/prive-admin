import { db } from "@prive-admin-tanstack/db"
import { bankAccount } from "@prive-admin-tanstack/db/schema/bank-account"
import { TRPCError } from "@trpc/server"
import { eq } from "drizzle-orm"
import { z } from "zod"

import { protectedProcedure, router } from "../index"

const currencySchema = z.enum(["EUR", "GBP"])

const bankAccountSchema = z.object({
  id: z.string().optional(),
  legalEntityId: z.string().min(1, "Legal entity is required"),
  iban: z
    .string()
    .min(15, "IBAN looks too short")
    .max(34, "IBAN looks too long")
    .regex(/^[A-Z]{2}\d{2}[A-Z0-9]+$/, "Invalid IBAN format"),
  currency: currencySchema,
  bankName: z.string().max(120).nullish(),
  swift: z.string().max(11).nullish(),
  displayName: z.string().min(1, "Display name is required").max(120),
})

export const bankAccountsRouter = router({
  get: protectedProcedure.input(z.object({ id: z.string().min(1) })).query(async ({ input }) => {
    const row = await db.query.bankAccount.findFirst({
      where: eq(bankAccount.id, input.id),
      with: {
        legalEntity: true,
      },
    })
    if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Bank account not found" })
    return row
  }),

  create: protectedProcedure.input(bankAccountSchema).mutation(async ({ input }) => {
    const [row] = await db
      .insert(bankAccount)
      .values({
        legalEntityId: input.legalEntityId,
        iban: input.iban,
        currency: input.currency,
        bankName: input.bankName ?? null,
        swift: input.swift ?? null,
        displayName: input.displayName,
      })
      .returning()
    return row
  }),

  update: protectedProcedure.input(bankAccountSchema.required({ id: true })).mutation(async ({ input }) => {
    const [row] = await db
      .update(bankAccount)
      .set({
        legalEntityId: input.legalEntityId,
        iban: input.iban,
        currency: input.currency,
        bankName: input.bankName ?? null,
        swift: input.swift ?? null,
        displayName: input.displayName,
      })
      .where(eq(bankAccount.id, input.id))
      .returning()
    if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Bank account not found" })
    return row
  }),
})
