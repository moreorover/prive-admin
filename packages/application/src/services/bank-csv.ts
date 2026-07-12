import { parse as parseCsv } from "csv-parse/sync"

export type BankCsvRow = {
  docNumber: string
  date: string
  currency: string
  amount: number
  counterpartyName: string | null
  counterpartyIban: string | null
  counterpartyBank: string | null
  swift: string | null
  purpose: string | null
  externalRef: string
  transactionType: string | null
  direction: "D" | "C"
  accountAmount: number
  accountIban: string
  accountCurrency: string
}

export type BankCsvParse = {
  accountIban: string
  rows: BankCsvRow[]
}

const IBAN_REGEX = /\(([A-Z]{2}\d{2}[A-Z0-9]+)\)/

function decimalToMinor(value: string): number {
  const trimmed = value.trim()
  if (!trimmed) return 0
  const normalized = trimmed.replace(/\s/g, "").replace(",", ".")
  const num = Number(normalized)
  if (!Number.isFinite(num)) throw new Error(`Cannot parse amount: ${value}`)
  return Math.round(num * 100)
}

function emptyToNull(value: string | undefined | null): string | null {
  if (value === undefined || value === null) return null
  const trimmed = value.trim()
  return trimmed.length === 0 ? null : trimmed
}

function isSwedbankOwnAccountTransfer(cols: string[]): boolean {
  return (cols[4] ?? "").trim().toLowerCase() === "transfer between own accounts"
}

function parseSebCsv(content: string): BankCsvParse {
  const stripped = content.charCodeAt(0) === 0xfeff ? content.slice(1) : content
  const records = parseCsv(stripped, {
    delimiter: ";",
    relax_column_count: true,
    skip_empty_lines: true,
  }) as string[][]

  if (records.length < 2) throw new Error("CSV file is empty or missing header")

  const titleCell = records[0]?.[0] ?? ""
  const ibanMatch = titleCell.match(IBAN_REGEX)
  if (!ibanMatch) throw new Error("Could not extract account IBAN from CSV header row")

  const rows: BankCsvRow[] = []
  for (const cols of records.slice(2)) {
    if (!cols.some((c) => c && c.trim().length > 0)) continue
    const directionRaw = (cols[14] ?? "").trim()
    if (directionRaw !== "D" && directionRaw !== "C") {
      throw new Error(`Unexpected direction value: ${cols[14]}`)
    }
    const externalRef = (cols[10] ?? "").trim()
    if (externalRef.length === 0) continue
    rows.push({
      docNumber: (cols[0] ?? "").trim(),
      date: (cols[1] ?? "").trim(),
      currency: (cols[2] ?? "").trim(),
      amount: decimalToMinor(cols[3] ?? "0"),
      counterpartyName: emptyToNull(cols[4]),
      counterpartyIban: emptyToNull(cols[6]),
      counterpartyBank: emptyToNull(cols[7]),
      swift: emptyToNull(cols[8]),
      purpose: emptyToNull(cols[9]),
      externalRef,
      transactionType: emptyToNull(cols[12]),
      direction: directionRaw,
      accountAmount: decimalToMinor(cols[15] ?? "0"),
      accountIban: (cols[16] ?? "").trim(),
      accountCurrency: (cols[17] ?? "").trim(),
    })
  }

  return { accountIban: ibanMatch[1]!, rows }
}

function parseSwedbankCsv(content: string): BankCsvParse {
  const stripped = content.charCodeAt(0) === 0xfeff ? content.slice(1) : content
  const records = parseCsv(stripped, {
    delimiter: ",",
    relax_column_count: true,
    skip_empty_lines: true,
  }) as string[][]

  if (records.length < 2) throw new Error("CSV file is empty or missing header")

  let accountIban = ""
  const rows: BankCsvRow[] = []

  for (const cols of records.slice(1)) {
    if ((cols[1] ?? "").trim() !== "20") continue
    if (isSwedbankOwnAccountTransfer(cols)) continue

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

  if (!accountIban) throw new Error("Could not extract account IBAN from Swedbank CSV")
  return { accountIban, rows }
}

function detectBankCsvFormat(content: string): "SEB" | "SWEDBANK" {
  const stripped = content.charCodeAt(0) === 0xfeff ? content.slice(1) : content
  const firstLine = stripped.split(/\r?\n/, 1)[0] ?? ""
  return firstLine.includes('"Account No"') ? "SWEDBANK" : "SEB"
}

export function parseBankCsv(content: string): BankCsvParse {
  return detectBankCsvFormat(content) === "SWEDBANK" ? parseSwedbankCsv(content) : parseSebCsv(content)
}
