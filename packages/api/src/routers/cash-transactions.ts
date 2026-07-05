import {
  createCashTransaction,
  deleteCashTransaction,
  getCustomer,
  listCashTransactions,
  updateCashTransaction,
} from "@prive-admin-tanstack/application/services"
import { z } from "zod"

import { toTrpcError } from "../errors"
import { protectedProcedure, router } from "../index"
import { getOffset, pagedResult, pageSchema, searchSchema } from "../pagination"

const pgIntegerSchema = z.number().int().min(-2147483648).max(2147483647)
const currencySchema = z.enum(["EUR", "GBP"])

const listSchema = pageSchema.extend({
  search: searchSchema,
  customerId: z.string().optional(),
  currency: currencySchema.optional(),
  direction: z.enum(["all", "received", "paid"]).default("all"),
  dateFrom: z.iso.date().optional(),
  dateTo: z.iso.date().optional(),
})

const cashTransactionSchema = z.object({
  id: z.string().optional(),
  customerId: z.string().min(1, "Customer is required"),
  createdAt: z.iso.date("Date is required"),
  description: z.string().max(120).nullish(),
  notes: z.string().max(1000).nullish(),
  amount: pgIntegerSchema.refine((value) => value !== 0, "Amount cannot be zero"),
  currency: currencySchema,
})

function dateToTimestampStart(value: string) {
  return value
}

export const cashTransactionsRouter = router({
  list: protectedProcedure.input(listSchema).query(async ({ input }) => {
    const result = await listCashTransactions({
      pageSize: input.pageSize,
      offset: getOffset(input),
      search: input.search ?? undefined,
      customerId: input.customerId,
      currency: input.currency,
      direction: input.direction,
      dateFrom: input.dateFrom,
      dateTo: input.dateTo,
    })
    return pagedResult(result.items, input, result.totalCount)
  }),

  create: protectedProcedure.input(cashTransactionSchema).mutation(async ({ input, ctx }) => {
    try {
      await getCustomer(input.customerId)
      return await createCashTransaction({
        customerId: input.customerId,
        createdById: ctx.session.user.id,
        createdAt: dateToTimestampStart(input.createdAt),
        description: input.description?.trim() || null,
        notes: input.notes?.trim() || null,
        amount: input.amount,
        currency: input.currency,
      })
    } catch (error) {
      throw toTrpcError(error)
    }
  }),

  update: protectedProcedure.input(cashTransactionSchema.required({ id: true })).mutation(async ({ input }) => {
    try {
      await getCustomer(input.customerId)
      return await updateCashTransaction({
        id: input.id,
        customerId: input.customerId,
        createdAt: dateToTimestampStart(input.createdAt),
        description: input.description?.trim() || null,
        notes: input.notes?.trim() || null,
        amount: input.amount,
        currency: input.currency,
      })
    } catch (error) {
      throw toTrpcError(error)
    }
  }),

  delete: protectedProcedure.input(z.object({ id: z.string().min(1) })).mutation(async ({ input }) => {
    try {
      return await deleteCashTransaction(input.id)
    } catch (error) {
      throw toTrpcError(error)
    }
  }),
})
