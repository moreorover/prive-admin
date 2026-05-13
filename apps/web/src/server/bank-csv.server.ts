import { parseSebCsv } from "./seb-csv.server"
import { parseSwedbankCsv } from "./swedbank-csv.server"

export type BankCsvRow = {
  docNumber: string
  date: string // YYYY-MM-DD
  currency: string
  amount: number // minor units
  counterpartyName: string | null
  counterpartyIban: string | null
  counterpartyBank: string | null
  swift: string | null
  purpose: string | null
  externalRef: string
  transactionType: string | null
  direction: "D" | "C"
  accountAmount: number // minor units
  accountIban: string
  accountCurrency: string
}

export type BankCsvParse = {
  accountIban: string
  rows: BankCsvRow[]
}

export type BankCsvFormat = "SEB" | "SWEDBANK"

export function detectBankCsvFormat(content: string): BankCsvFormat {
  const stripped = content.charCodeAt(0) === 0xfeff ? content.slice(1) : content
  const firstLine = stripped.split(/\r?\n/, 1)[0] ?? ""
  if (firstLine.includes('"Account No"')) return "SWEDBANK"
  return "SEB"
}

export function parseBankCsv(content: string): BankCsvParse {
  const format = detectBankCsvFormat(content)
  return format === "SWEDBANK" ? parseSwedbankCsv(content) : parseSebCsv(content)
}
