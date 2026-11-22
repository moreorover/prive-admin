import {
  getBankStatementEntry,
  ignoreBankStatementEntry,
  importBankStatementCsv,
  previewBankStatementCsv,
  listBankStatementEntries,
  undoBankStatementEntry,
} from "@prive-admin-tanstack/application/services"
import { z } from "zod"

import { toTrpcError } from "../errors"
import { protectedProcedure, router } from "../index"
import { getOffset, pagedResult, pageSchema, searchSchema } from "../pagination"

const bankStatementEntryListSchema = pageSchema.extend({
  bankAccountId: z.string().optional(),
  bankAccountIds: z.array(z.string().min(1)).optional(),
  status: z.enum(["PENDING", "IGNORED"]).optional(),
  legalEntityId: z.string().min(1).optional(),
  from: z.iso.date().optional(),
  to: z.iso.date().optional(),
  query: searchSchema,
})

export const bankStatementEntriesRouter = router({
  previewCsv: protectedProcedure.input(z.object({ csv: z.string().min(1) })).mutation(async ({ input }) => {
    try {
      return await previewBankStatementCsv(input)
    } catch (error) {
      throw toTrpcError(error)
    }
  }),

  importCsv: protectedProcedure.input(z.object({ csv: z.string().min(1) })).mutation(async ({ input }) => {
    try {
      return await importBankStatementCsv(input)
    } catch (error) {
      throw toTrpcError(error)
    }
  }),

  list: protectedProcedure.input(bankStatementEntryListSchema).query(async ({ input }) => {
    try {
      const result = await listBankStatementEntries({
        pageSize: input.pageSize,
        offset: getOffset(input),
        bankAccountId: input.bankAccountId,
        bankAccountIds: input.bankAccountIds,
        status: input.status,
        legalEntityId: input.legalEntityId,
        from: input.from,
        to: input.to,
        query: input.query,
      })
      return pagedResult(result.items, input, result.totalCount)
    } catch (error) {
      throw toTrpcError(error)
    }
  }),

  get: protectedProcedure.input(z.object({ id: z.string().min(1) })).query(async ({ input }) => {
    try {
      return await getBankStatementEntry(input.id)
    } catch (error) {
      throw toTrpcError(error)
    }
  }),

  ignore: protectedProcedure.input(z.object({ id: z.string().min(1) })).mutation(async ({ input }) => {
    try {
      return await ignoreBankStatementEntry(input.id)
    } catch (error) {
      throw toTrpcError(error)
    }
  }),

  undo: protectedProcedure.input(z.object({ id: z.string().min(1) })).mutation(async ({ input }) => {
    try {
      return await undoBankStatementEntry(input.id)
    } catch (error) {
      throw toTrpcError(error)
    }
  }),
})
