import { z } from "zod"

import { createBankAccount, getBankAccount, updateBankAccount } from "../../../application/src/services/bank-accounts"
import { toTrpcError } from "../errors"
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
    try {
      return await getBankAccount(input.id)
    } catch (error) {
      throw toTrpcError(error)
    }
  }),

  create: protectedProcedure.input(bankAccountSchema).mutation(async ({ input }) => {
    return createBankAccount({
      legalEntityId: input.legalEntityId,
      iban: input.iban,
      currency: input.currency,
      bankName: input.bankName,
      swift: input.swift,
      displayName: input.displayName,
    })
  }),

  update: protectedProcedure.input(bankAccountSchema.required({ id: true })).mutation(async ({ input }) => {
    try {
      return await updateBankAccount({
        id: input.id,
        legalEntityId: input.legalEntityId,
        iban: input.iban,
        currency: input.currency,
        bankName: input.bankName,
        swift: input.swift,
        displayName: input.displayName,
      })
    } catch (error) {
      throw toTrpcError(error)
    }
  }),
})
