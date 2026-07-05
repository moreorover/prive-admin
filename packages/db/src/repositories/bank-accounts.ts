import { eq } from "drizzle-orm"

import { db, type Db } from "../index"
import { bankAccount } from "../schema/bank-account"

export type BankAccountUpsertInput = {
  id?: string
  legalEntityId: string
  iban: string
  currency: string
  bankName?: string | null
  swift?: string | null
  displayName: string
}

export async function getBankAccount(database: Db = db, id: string) {
  return database.query.bankAccount.findFirst({
    where: eq(bankAccount.id, id),
    with: {
      legalEntity: true,
    },
  })
}

export async function createBankAccount(database: Db = db, input: BankAccountUpsertInput) {
  const [row] = await database
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
}

export async function updateBankAccount(
  database: Db = db,
  input: Required<Pick<BankAccountUpsertInput, "id">> & BankAccountUpsertInput,
) {
  const [row] = await database
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
  return row
}
