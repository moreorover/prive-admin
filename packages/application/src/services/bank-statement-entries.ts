import {
  findBankAccountByIban,
  getBankStatementEntry as findBankStatementEntry,
  ignoreBankStatementEntry as patchIgnoreBankStatementEntry,
  importBankStatementEntries as insertBankStatementEntries,
  listBankStatementEntries as fetchBankStatementEntries,
  undoBankStatementEntry as patchUndoBankStatementEntry,
} from "@prive-admin-tanstack/db"

import { notFound, unexpectedError } from "../errors"

export async function importBankStatementEntries(input: {
  accountIban: string
  values: Array<{
    bankAccountId: string
    externalRef: string
    docNumber: string | null
    date: string
    amount: number
    currency: string
    direction: "C" | "D"
    counterpartyName: string | null
    counterpartyIban: string | null
    counterpartyBank: string | null
    swift: string | null
    purpose: string | null
    transactionType: string | null
  }>
}) {
  try {
    return await insertBankStatementEntries(undefined, input)
  } catch (error) {
    throw unexpectedError("Failed to import bank statement entries", error)
  }
}

export async function findBankAccountForIban(iban: string) {
  return findBankAccountByIban(undefined, iban)
}

export async function listBankStatementEntries(input: {
  pageSize: number
  offset: number
  bankAccountId?: string
  status?: "PENDING" | "IGNORED"
}) {
  return fetchBankStatementEntries(undefined, input)
}

export async function getBankStatementEntry(id: string) {
  const row = await findBankStatementEntry(undefined, id)
  if (!row) throw notFound("Statement entry not found")
  return row
}

export async function ignoreBankStatementEntry(id: string) {
  const row = await patchIgnoreBankStatementEntry(undefined, id)
  if (!row) throw notFound("Statement entry not found")
  return row
}

export async function undoBankStatementEntry(id: string) {
  const row = await patchUndoBankStatementEntry(undefined, id)
  if (!row) throw notFound("Statement entry not found")
  return row
}
