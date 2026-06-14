import { db } from "@prive-admin-tanstack/db"
import { bankAccount } from "@prive-admin-tanstack/db/schema/bank-account"
import { bankStatementEntry } from "@prive-admin-tanstack/db/schema/bank-statement-entry"
import { createServerFn } from "@tanstack/react-start"
import { and, desc, eq } from "drizzle-orm"
import { z } from "zod"

import { requireAuthMiddleware } from "@/middleware/auth"
import { parseBankCsv } from "@/server/bank-csv.server"

export const importBankCsv = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator(z.object({ csv: z.string().min(1) }))
  .handler(async ({ data }) => {
    const parsed = parseBankCsv(data.csv)

    const account = await db.query.bankAccount.findFirst({
      where: eq(bankAccount.iban, parsed.accountIban),
      columns: { id: true, currency: true },
    })
    if (!account) {
      throw new Error(
        `No bank account configured for IBAN ${parsed.accountIban}. Add it from the legal entity's Bank accounts tab first.`,
      )
    }

    if (parsed.rows.length === 0) {
      return { accountIban: parsed.accountIban, inserted: 0, skipped: 0, total: 0 }
    }

    // Insert all entries with onConflictDoNothing on (bank_account_id, external_ref)
    const values = parsed.rows.map((r) => ({
      bankAccountId: account.id,
      externalRef: r.externalRef,
      docNumber: r.docNumber || null,
      date: r.date,
      amount: r.accountAmount, // store amount in account currency
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
  })

export const listBankStatementEntries = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .inputValidator(
    z.object({
      bankAccountId: z.string().optional(),
      status: z.enum(["PENDING", "IGNORED"]).optional(),
    }),
  )
  .handler(async ({ data }) => {
    const conditions = []
    if (data.bankAccountId) conditions.push(eq(bankStatementEntry.bankAccountId, data.bankAccountId))
    if (data.status) conditions.push(eq(bankStatementEntry.status, data.status))

    return db.query.bankStatementEntry.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        bankAccount: { with: { legalEntity: true } },
      },
      orderBy: [desc(bankStatementEntry.date), desc(bankStatementEntry.importedAt)],
      limit: 500,
    })
  })

export const getBankStatementEntry = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .inputValidator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    const row = await db.query.bankStatementEntry.findFirst({
      where: eq(bankStatementEntry.id, data.id),
      with: {
        bankAccount: { with: { legalEntity: true } },
      },
    })
    if (!row) throw new Error("Statement entry not found")
    return row
  })

export const ignoreStatementEntry = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    const [row] = await db
      .update(bankStatementEntry)
      .set({ status: "IGNORED" })
      .where(eq(bankStatementEntry.id, data.id))
      .returning({ id: bankStatementEntry.id, status: bankStatementEntry.status })
    if (!row) throw new Error("Statement entry not found")
    return row
  })

export const undoStatementEntry = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    const [row] = await db
      .update(bankStatementEntry)
      .set({ status: "PENDING" })
      .where(eq(bankStatementEntry.id, data.id))
      .returning({ id: bankStatementEntry.id, status: bankStatementEntry.status })
    if (!row) throw new Error("Statement entry not found")
    return row
  })
