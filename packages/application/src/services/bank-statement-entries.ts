import {
  findBankAccountByIban,
  getBankStatementEntry as findBankStatementEntry,
  ignoreBankStatementEntry as patchIgnoreBankStatementEntry,
  importBankStatementEntries as insertBankStatementEntries,
  listBankStatementEntries as fetchBankStatementEntries,
  listBankAccounts,
  undoBankStatementEntry as patchUndoBankStatementEntry,
} from "@prive-admin-tanstack/db"

import { badRequest, notFound, unexpectedError } from "../errors"
import { parseBankCsv } from "./bank-csv"

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
  legalEntityId?: string
  status?: "PENDING" | "IGNORED"
  from?: string
  to?: string
  query?: string
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

function normalizeIban(value: string) {
  return value.replace(/\s/g, "").toUpperCase()
}

function isValidIban(iban: string) {
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(iban)) return false
  const rearranged = iban.slice(4) + iban.slice(0, 4)
  let remainder = 0
  for (const char of rearranged) {
    const digits = /[A-Z]/.test(char) ? String(char.charCodeAt(0) - 55) : char
    for (const digit of digits) remainder = (remainder * 10 + Number(digit)) % 97
  }
  return remainder === 1
}

async function validateBankStatementCsv(input: { csv: string }) {
  let parsed
  try {
    parsed = parseBankCsv(input.csv)
  } catch (error) {
    throw badRequest(error instanceof Error ? error.message : "Invalid bank statement CSV", { cause: error })
  }
  const accountIban = normalizeIban(parsed.accountIban)
  if (!isValidIban(accountIban)) throw badRequest("Missing or invalid account IBAN in CSV")
  if (parsed.rows.some((row) => normalizeIban(row.accountIban) !== accountIban)) {
    throw badRequest("CSV rows must all belong to the statement account IBAN")
  }
  const accounts = await listBankAccounts()
  const matches = accounts.filter((account) => normalizeIban(account.iban) === accountIban)
  if (matches.length === 0) {
    throw badRequest(
      `No bank account configured for IBAN ${accountIban}. Add it from the legal entity's Bank accounts tab first.`,
    )
  }
  if (matches.length !== 1)
    throw badRequest(
      `Multiple bank accounts configured for IBAN ${accountIban}. Resolve the ambiguity before importing.`,
    )
  return { parsed, accountIban, account: matches[0]! }
}

export async function previewBankStatementCsv(input: { csv: string }) {
  const { parsed, accountIban, account } = await validateBankStatementCsv(input)
  return {
    accountIban,
    total: parsed.rows.length,
    account: {
      id: account.id,
      displayName: account.displayName,
      legalEntity: { id: account.legalEntity.id, name: account.legalEntity.name },
    },
  }
}

export async function importBankStatementCsv(input: { csv: string }) {
  const { parsed, accountIban, account } = await validateBankStatementCsv(input)
  const values = parsed.rows.map((row) => ({
    bankAccountId: account.id,
    externalRef: row.externalRef,
    docNumber: row.docNumber || null,
    date: row.date,
    amount: row.accountAmount,
    currency: row.accountCurrency || account.currency,
    direction: row.direction,
    counterpartyName: row.counterpartyName,
    counterpartyIban: row.counterpartyIban,
    counterpartyBank: row.counterpartyBank,
    swift: row.swift,
    purpose: row.purpose,
    transactionType: row.transactionType,
  }))
  const inserted = values.length ? await importBankStatementEntries({ accountIban, values }) : []
  return { accountIban, total: values.length, inserted: inserted.length, skipped: values.length - inserted.length }
}
