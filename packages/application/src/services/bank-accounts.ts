import {
  createBankAccount as insertBankAccount,
  getBankAccount as findBankAccount,
  updateBankAccount as patchBankAccount,
} from "@prive-admin-tanstack/db"

import { notFound, unexpectedError } from "../errors"

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
  let result
  try {
    result = await insertBankAccount(undefined, input)
  } catch (error) {
    throw unexpectedError("Failed to create bank account", error)
  }

  if (!result) {
    throw unexpectedError("Failed to create bank account")
  }

  return result
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
  let result
  try {
    result = await patchBankAccount(undefined, input)
  } catch (error) {
    throw unexpectedError("Failed to update bank account", error)
  }

  if (!result) throw notFound("Bank account not found")
  return result
}
