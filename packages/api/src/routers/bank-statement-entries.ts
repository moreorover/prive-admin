import { badRequest } from "@prive-admin-tanstack/application/errors"
import {
  findBankAccountForIban,
  getBankStatementEntry,
  ignoreBankStatementEntry,
  importBankStatementEntries,
  listBankStatementEntryMatchCandidates,
  listBankStatementEntries,
  undoBankStatementEntry,
} from "@prive-admin-tanstack/application/services"
import { parseBankCsv } from "@prive-admin-tanstack/application/services"
import { z } from "zod"

import { toTrpcError } from "../errors"
import { protectedProcedure, router } from "../index"
import { getOffset, pagedResult, pageSchema } from "../pagination"

const bankStatementEntryListSchema = pageSchema.extend({
  bankAccountId: z.string().optional(),
  status: z.enum(["PENDING", "IGNORED"]).optional(),
})

export const bankStatementEntriesRouter = router({
  importCsv: protectedProcedure.input(z.object({ csv: z.string().min(1) })).mutation(async ({ input }) => {
    try {
      const parsed = parseBankCsv(input.csv)

      const account = await findBankAccountForIban(parsed.accountIban)
      if (!account) {
        throw badRequest(
          `No bank account configured for IBAN ${parsed.accountIban}. Add it from the legal entity's Bank accounts tab first.`,
        )
      }

      if (parsed.rows.length === 0) {
        return { accountIban: parsed.accountIban, inserted: 0, skipped: 0, total: 0 }
      }

      const values = parsed.rows.map((r: (typeof parsed.rows)[number]) => ({
        bankAccountId: account.id,
        externalRef: r.externalRef,
        docNumber: r.docNumber || null,
        date: r.date,
        amount: r.accountAmount,
        currency: r.accountCurrency || account.currency,
        direction: r.direction,
        counterpartyName: r.counterpartyName,
        counterpartyIban: r.counterpartyIban,
        counterpartyBank: r.counterpartyBank,
        swift: r.swift,
        purpose: r.purpose,
        transactionType: r.transactionType,
      }))

      const inserted = await importBankStatementEntries({
        accountIban: parsed.accountIban,
        values,
      })

      return {
        accountIban: parsed.accountIban,
        total: values.length,
        inserted: inserted.length,
        skipped: values.length - inserted.length,
      }
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
        status: input.status,
      })
      return pagedResult(result.items, input, result.totalCount)
    } catch (error) {
      throw toTrpcError(error)
    }
  }),

  listMatchCandidates: protectedProcedure.input(pageSchema).query(async ({ input }) => {
    try {
      const result = await listBankStatementEntryMatchCandidates({
        pageSize: input.pageSize,
        offset: getOffset(input),
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
