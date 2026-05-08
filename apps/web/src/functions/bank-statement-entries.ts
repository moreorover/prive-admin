import { db } from "@prive-admin-tanstack/db"
import { personnelOnAppointments } from "@prive-admin-tanstack/db/schema/appointment"
import { bankAccount } from "@prive-admin-tanstack/db/schema/bank-account"
import { bankStatementEntry } from "@prive-admin-tanstack/db/schema/bank-statement-entry"
import { transaction } from "@prive-admin-tanstack/db/schema/transaction"
import { createServerFn } from "@tanstack/react-start"
import { and, desc, eq } from "drizzle-orm"
import { z } from "zod"

import { requireAuthMiddleware } from "@/middleware/auth"
import { parseSebCsv } from "@/server/seb-csv.server"

export const importSebCsv = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator(z.object({ csv: z.string().min(1) }))
  .handler(async ({ data }) => {
    const parsed = parseSebCsv(data.csv)

    const account = await db.query.bankAccount.findFirst({
      where: eq(bankAccount.iban, parsed.accountIban),
      columns: { id: true, currency: true },
    })
    if (!account) {
      throw new Error(`No bank account configured for IBAN ${parsed.accountIban}. Add it in /bank-accounts first.`)
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
      status: z.enum(["PENDING", "LINKED", "IGNORED"]).optional(),
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
        linkedTransaction: true,
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
        linkedTransaction: true,
      },
    })
    if (!row) throw new Error("Statement entry not found")
    return row
  })

export const promoteEntryToTransaction = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator(
    z.object({
      entryId: z.string().min(1),
      customerId: z.string().min(1),
      appointmentId: z.string().nullish(),
      name: z.string().nullish(),
      notes: z.string().nullish(),
    }),
  )
  .handler(async ({ data }) => {
    return await db.transaction(async (tx) => {
      const entry = await tx.query.bankStatementEntry.findFirst({
        where: eq(bankStatementEntry.id, data.entryId),
        with: { bankAccount: { columns: { id: true, legalEntityId: true } } },
      })
      if (!entry) throw new Error("Statement entry not found")
      if (entry.status === "LINKED") throw new Error("Entry already linked to a transaction")
      if (entry.status === "IGNORED") throw new Error("Entry is marked ignored; un-ignore first")

      if (data.appointmentId) {
        const allowed = new Set<string>()
        const appt = await tx.query.appointment.findFirst({
          where: (a, { eq }) => eq(a.id, data.appointmentId!),
          columns: { id: true, clientId: true },
        })
        if (!appt) throw new Error("Appointment not found")
        allowed.add(appt.clientId)
        const personnel = await tx
          .select({ personnelId: personnelOnAppointments.personnelId })
          .from(personnelOnAppointments)
          .where(eq(personnelOnAppointments.appointmentId, data.appointmentId))
        for (const p of personnel) allowed.add(p.personnelId)
        if (!allowed.has(data.customerId)) {
          throw new Error("Customer must be the appointment client or assigned personnel")
        }
      }

      const [created] = await tx
        .insert(transaction)
        .values({
          name: data.name ?? null,
          notes: data.notes ?? entry.purpose ?? null,
          amount: entry.amount,
          currency: entry.currency,
          type: "BANK",
          status: "COMPLETED",
          completedDateBy: entry.date,
          customerId: data.customerId,
          appointmentId: data.appointmentId ?? null,
          legalEntityId: entry.bankAccount.legalEntityId,
          bankAccountId: entry.bankAccount.id,
        })
        .returning()

      await tx
        .update(bankStatementEntry)
        .set({ status: "LINKED", linkedTransactionId: created.id })
        .where(eq(bankStatementEntry.id, entry.id))

      return { transactionId: created.id, entryId: entry.id }
    })
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
    return await db.transaction(async (tx) => {
      const entry = await tx.query.bankStatementEntry.findFirst({
        where: eq(bankStatementEntry.id, data.id),
        columns: { id: true, status: true, linkedTransactionId: true },
      })
      if (!entry) throw new Error("Statement entry not found")
      if (entry.status === "LINKED" && entry.linkedTransactionId) {
        await tx.delete(transaction).where(eq(transaction.id, entry.linkedTransactionId))
      }
      const [row] = await tx
        .update(bankStatementEntry)
        .set({ status: "PENDING", linkedTransactionId: null })
        .where(eq(bankStatementEntry.id, entry.id))
        .returning({ id: bankStatementEntry.id, status: bankStatementEntry.status })
      return row
    })
  })
