import { db } from "@prive-admin-tanstack/db"
import { bankAccount } from "@prive-admin-tanstack/db/schema/bank-account"
import { createServerFn } from "@tanstack/react-start"
import { eq } from "drizzle-orm"
import { z } from "zod"

import { bankAccountSchema } from "@/lib/schemas"
import { requireAuthMiddleware } from "@/middleware/auth"

export const listBankAccounts = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .handler(async () => {
    return db.query.bankAccount.findMany({
      with: { legalEntity: true },
      orderBy: (a, { asc }) => [asc(a.displayName)],
    })
  })

export const getBankAccount = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .inputValidator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    const row = await db.query.bankAccount.findFirst({
      where: eq(bankAccount.id, data.id),
      with: { legalEntity: true },
    })
    if (!row) throw new Error("Bank account not found")
    return row
  })

export const createBankAccount = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator(bankAccountSchema)
  .handler(async ({ data }) => {
    const [row] = await db
      .insert(bankAccount)
      .values({
        legalEntityId: data.legalEntityId,
        iban: data.iban,
        currency: data.currency,
        bankName: data.bankName ?? null,
        swift: data.swift ?? null,
        displayName: data.displayName,
      })
      .returning()
    return row
  })

export const updateBankAccount = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator(bankAccountSchema.required({ id: true }))
  .handler(async ({ data }) => {
    const [row] = await db
      .update(bankAccount)
      .set({
        legalEntityId: data.legalEntityId,
        iban: data.iban,
        currency: data.currency,
        bankName: data.bankName ?? null,
        swift: data.swift ?? null,
        displayName: data.displayName,
      })
      .where(eq(bankAccount.id, data.id!))
      .returning()
    if (!row) throw new Error("Bank account not found")
    return row
  })
