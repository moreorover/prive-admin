import { db } from "@prive-admin-tanstack/db"
import { bankAccount } from "@prive-admin-tanstack/db/schema/bank-account"
import { bankStatementEntry } from "@prive-admin-tanstack/db/schema/bank-statement-entry"
import { TRPCError } from "@trpc/server"
import { and, count, desc, eq } from "drizzle-orm"
import { z } from "zod"

import { parseBankCsv } from "../bank-csv"
import { protectedProcedure, router } from "../index"
import { getOffset, pagedResult, pageSchema } from "../pagination"

const bankStatementEntryListSchema = pageSchema.extend({
  bankAccountId: z.string().optional(),
  status: z.enum(["PENDING", "IGNORED"]).optional(),
})

export const bankStatementEntriesRouter = router({
  importCsv: protectedProcedure.input(z.object({ csv: z.string().min(1) })).mutation(async ({ input }) => {
    const parsed = parseBankCsv(input.csv)

    const account = await db.query.bankAccount.findFirst({
      where: eq(bankAccount.iban, parsed.accountIban),
      columns: { id: true, currency: true },
    })
    if (!account) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `No bank account configured for IBAN ${parsed.accountIban}. Add it from the legal entity's Bank accounts tab first.`,
      })
    }

    if (parsed.rows.length === 0) {
      return { accountIban: parsed.accountIban, inserted: 0, skipped: 0, total: 0 }
    }

    const values = parsed.rows.map((r) => ({
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

    const inserted = await db
      .insert(bankStatementEntry)
      .values(values)
      .onConflictDoNothing({
        target: [bankStatementEntry.bankAccountId, bankStatementEntry.externalRef],
      })
      .returning({ id: bankStatementEntry.id })

    return {
      accountIban: parsed.accountIban,
      total: values.length,
      inserted: inserted.length,
      skipped: values.length - inserted.length,
    }
  }),

  list: protectedProcedure.input(bankStatementEntryListSchema).query(async ({ input }) => {
    const conditions = []
    if (input.bankAccountId) conditions.push(eq(bankStatementEntry.bankAccountId, input.bankAccountId))
    if (input.status) conditions.push(eq(bankStatementEntry.status, input.status))
    const where = conditions.length > 0 ? and(...conditions) : undefined

    const items = await db.query.bankStatementEntry.findMany({
      where,
      with: {
        bankAccount: { with: { legalEntity: true } },
      },
      orderBy: [desc(bankStatementEntry.date), desc(bankStatementEntry.importedAt)],
      limit: input.pageSize,
      offset: getOffset(input),
    })

    const [countRow] = await db.select({ totalCount: count() }).from(bankStatementEntry).where(where)

    return pagedResult(items, input, countRow?.totalCount ?? 0)
  }),

  get: protectedProcedure.input(z.object({ id: z.string().min(1) })).query(async ({ input }) => {
    const row = await db.query.bankStatementEntry.findFirst({
      where: eq(bankStatementEntry.id, input.id),
      with: {
        bankAccount: { with: { legalEntity: true } },
      },
    })
    if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Statement entry not found" })
    return row
  }),

  ignore: protectedProcedure.input(z.object({ id: z.string().min(1) })).mutation(async ({ input }) => {
    const [row] = await db
      .update(bankStatementEntry)
      .set({ status: "IGNORED" })
      .where(eq(bankStatementEntry.id, input.id))
      .returning({ id: bankStatementEntry.id, status: bankStatementEntry.status })
    if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Statement entry not found" })
    return row
  }),

  undo: protectedProcedure.input(z.object({ id: z.string().min(1) })).mutation(async ({ input }) => {
    const [row] = await db
      .update(bankStatementEntry)
      .set({ status: "PENDING" })
      .where(eq(bankStatementEntry.id, input.id))
      .returning({ id: bankStatementEntry.id, status: bankStatementEntry.status })
    if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Statement entry not found" })
    return row
  }),
})
