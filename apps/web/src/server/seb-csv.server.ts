import { parse as parseCsv } from "csv-parse/sync"

type SebCsvRow = {
  docNumber: string
  date: string // YYYY-MM-DD
  currency: string
  amount: number // minor units (cents)
  counterpartyName: string | null
  counterpartyId: string | null
  counterpartyIban: string | null
  counterpartyBank: string | null
  swift: string | null
  purpose: string | null
  externalRef: string // transakcijos kodas
  documentDate: string | null
  transactionType: string | null
  reference: string | null
  direction: "D" | "C"
  accountAmount: number // minor units
  accountIban: string
  accountCurrency: string
}

export type SebCsvParse = {
  accountIban: string
  rows: SebCsvRow[]
}

const IBAN_REGEX = /\(([A-Z]{2}\d{2}[A-Z0-9]+)\)/

function ltDecimalToMinor(value: string): number {
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

export function parseSebCsv(content: string): SebCsvParse {
  // Strip BOM
  const stripped = content.charCodeAt(0) === 0xfeff ? content.slice(1) : content

  // The file uses ; as the delimiter and CRLF or LF line endings; csv-parse handles both.
  // Allow column count to vary because the trailing semicolon produces an empty 19th column.
  const records = parseCsv(stripped, {
    delimiter: ";",
    relax_column_count: true,
    skip_empty_lines: true,
  }) as string[][]

  if (records.length < 2) {
    throw new Error("CSV file is empty or missing header")
  }

  const titleCell = records[0]?.[0] ?? ""
  const ibanMatch = titleCell.match(IBAN_REGEX)
  if (!ibanMatch) {
    throw new Error("Could not extract account IBAN from CSV header row")
  }
  const accountIban = ibanMatch[1]

  // Row 1 is the title; row 2 is the column header; rows 3+ are data.
  const dataRows = records.slice(2)

  const rows: SebCsvRow[] = []
  for (const cols of dataRows) {
    if (!cols.some((c) => c && c.trim().length > 0)) continue
    const directionRaw = (cols[14] ?? "").trim()
    if (directionRaw !== "D" && directionRaw !== "C") {
      throw new Error(`Unexpected direction value: ${cols[14]}`)
    }
    const direction = directionRaw as "D" | "C"
    const externalRef = (cols[10] ?? "").trim()
    if (externalRef.length === 0) continue
    rows.push({
      docNumber: (cols[0] ?? "").trim(),
      date: (cols[1] ?? "").trim(),
      currency: (cols[2] ?? "").trim(),
      amount: ltDecimalToMinor(cols[3] ?? "0"),
      counterpartyName: emptyToNull(cols[4]),
      counterpartyId: emptyToNull(cols[5]),
      counterpartyIban: emptyToNull(cols[6]),
      counterpartyBank: emptyToNull(cols[7]),
      swift: emptyToNull(cols[8]),
      purpose: emptyToNull(cols[9]),
      externalRef,
      documentDate: emptyToNull(cols[11]),
      transactionType: emptyToNull(cols[12]),
      reference: emptyToNull(cols[13]),
      direction,
      accountAmount: ltDecimalToMinor(cols[15] ?? "0"),
      accountIban: (cols[16] ?? "").trim(),
      accountCurrency: (cols[17] ?? "").trim(),
    })
  }

  return { accountIban, rows }
}
