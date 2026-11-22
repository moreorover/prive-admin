import {
  createTransaction,
  deleteTransaction,
  listTransactions,
  resolveTransactionCurrency,
  updateTransaction,
} from "@prive-admin-tanstack/application/services"
import { z } from "zod"

import { toTrpcError } from "../errors"
import { ownerProcedure, protectedProcedure, router } from "../index"
import { getOffset, pagedResult, pageSchema } from "../pagination"

const currencySchema = z.enum(["GBP", "EUR"])

const transactionFieldsSchema = z.object({
  name: z.string().nullish(),
  notes: z.string().nullish(),
  movementType: z.enum(["received", "personnel_allocation", "refund", "adjustment"]),
  amount: z.number().int(),
  currency: currencySchema,
})

const transactionListSchema = pageSchema.extend({
  appointmentId: z.string().optional(),
  customerId: z.string().optional(),
  currency: currencySchema.optional(),
})

export const transactionsRouter = router({
  list: protectedProcedure.input(transactionListSchema).query(async ({ input }) => {
    const result = await listTransactions({
      pageSize: input.pageSize,
      offset: getOffset(input),
      appointmentId: input.appointmentId,
      customerId: input.customerId,
      currency: input.currency,
    })
    return pagedResult(result.items, input, result.totalCount)
  }),

  create: protectedProcedure
    .input(
      transactionFieldsSchema.extend({
        appointmentId: z.string().min(1),
        customerId: z.string().min(1),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        return await createTransaction({
          appointmentId: input.appointmentId,
          customerId: input.customerId,
          name: input.name ?? null,
          notes: input.notes ?? null,
          movementType: input.movementType,
          amount: input.amount,
          currency: input.currency,
        })
      } catch (error) {
        throw toTrpcError(error)
      }
    }),

  update: protectedProcedure
    .input(transactionFieldsSchema.extend({ id: z.string().min(1) }))
    .mutation(async ({ input }) => {
      try {
        return await updateTransaction({
          id: input.id,
          name: input.name ?? null,
          notes: input.notes ?? null,
          movementType: input.movementType,
          amount: input.amount,
          currency: input.currency,
        })
      } catch (error) {
        throw toTrpcError(error)
      }
    }),

  resolveCurrency: ownerProcedure
    .input(z.object({ id: z.string().min(1), storedCurrency: z.string(), currency: currencySchema }))
    .mutation(async ({ input }) => {
      try {
        return await resolveTransactionCurrency(input)
      } catch (error) {
        throw toTrpcError(error)
      }
    }),

  delete: protectedProcedure.input(z.object({ id: z.string().min(1) })).mutation(async ({ input }) => {
    try {
      return await deleteTransaction(input.id)
    } catch (error) {
      throw toTrpcError(error)
    }
  }),
})
