import {
  createBankAccount as insertBankAccount,
  getBankAccount as findBankAccount,
  updateBankAccount as patchBankAccount,
} from "@prive-admin-tanstack/db"

import { notFound } from "../errors"

export async function getBankAccount(id: string) {
  const result = await findBankAccount(undefined, id)
  if (!result) throw notFound("Bank account not found")
  return result
}

export async function createBankAccount(input: {
  legalEntityId: string
  iban: string
  currency: string
  bankName?: string | null
  swift?: string | null
  displayName: string
}) {
  return insertBankAccount(undefined, input)
}

export async function updateBankAccount(input: {
  id: string
  legalEntityId: string
  iban: string
  currency: string
  bankName?: string | null
  swift?: string | null
  displayName: string
}) {
  const result = await patchBankAccount(undefined, input)
  if (!result) throw notFound("Bank account not found")
  return result
}
