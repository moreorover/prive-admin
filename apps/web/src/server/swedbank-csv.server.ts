import { parse as parseCsv } from "csv-parse/sync"

import type { BankCsvParse, BankCsvRow } from "./bank-csv.server"

function decimalToMinor(value: string): number {
  const trimmed = value.trim()
  if (!trimmed) return 0
  const normalized = trimmed.replace(/\s/g, "").replace(",", ".")
  const num = Number(normalized)
  if (!Number.isFinite(num)) {
    throw new Error(`Cannot parse amount: ${value}`)
  }
  return Math.round(num * 100)
}

function emptyToNull(value: string | undefined | null): string | null {
  if (value === undefined || value === null) return null
  const trimmed = value.trim()
  return trimmed.length === 0 ? null : trimmed
}

// Swedbank LT CSV export. Comma delimited, quoted fields. Columns:
// 0 Account No, 1 Code (10/20/82/86), 2 Date, 3 Beneficiary, 4 Details,
// 5 Amount, 6 Currency, 7 D/K, 8 Record ID, 9 Code, 10 Reference No,
// 11 Doc. No, 12 Code in payer IS, 13 Client code, 14 Originator, 15 Beneficiary party.
// Only code "20" rows are real transactions; 10/82/86 are balance/turnover summaries.
export function parseSwedbankCsv(content: string): BankCsvParse {
  const stripped = content.charCodeAt(0) === 0xfeff ? content.slice(1) : content

  const records = parseCsv(stripped, {
    delimiter: ",",
    relax_column_count: true,
    skip_empty_lines: true,
  }) as string[][]

  if (records.length < 2) {
    throw new Error("CSV file is empty or missing header")
  }

  const dataRows = records.slice(1)

  let accountIban = ""
  const rows: BankCsvRow[] = []

  for (const cols of dataRows) {
    const rowCode = (cols[1] ?? "").trim()
    if (rowCode !== "20") continue

    const iban = (cols[0] ?? "").trim()
    if (!accountIban) accountIban = iban

    const directionRaw = (cols[7] ?? "").trim()
    let direction: "D" | "C"
    if (directionRaw === "K") direction = "C"
    else if (directionRaw === "D") direction = "D"
    else throw new Error(`Unexpected direction value: ${cols[7]}`)

    const amount = decimalToMinor(cols[5] ?? "0")
    const currency = (cols[6] ?? "").trim()
    const externalRef = (cols[8] ?? "").trim()
    if (!externalRef) continue

    rows.push({
      docNumber: (cols[11] ?? "").trim(),
      date: (cols[2] ?? "").trim(),
      currency,
      amount,
      counterpartyName: emptyToNull(cols[3]),
      counterpartyIban: null,
      counterpartyBank: null,
      swift: null,
      purpose: emptyToNull(cols[4]),
      externalRef,
      transactionType: emptyToNull(cols[9]),
      direction,
      accountAmount: amount,
      accountIban: iban,
      accountCurrency: currency,
    })
  }

  if (!accountIban) {
    throw new Error("Could not extract account IBAN from Swedbank CSV")
  }

  return { accountIban, rows }
}
