import { z } from "zod"

export const CURRENCIES = ["GBP", "EUR"] as const
export type Currency = (typeof CURRENCIES)[number]

export const currencySchema = z.enum(CURRENCIES)

const SYMBOLS: Record<Currency, string> = {
  GBP: "£",
  EUR: "€",
}

export const currencySymbol = (currency: Currency): string => SYMBOLS[currency]

export const isCurrency = (value: string): value is Currency => value === "GBP" || value === "EUR"

export function minorToDecimal(minor: number | bigint): string {
  const units = BigInt(minor)
  const digits = (units < 0n ? -units : units).toString().padStart(3, "0")
  return `${units < 0n ? "-" : ""}${digits.slice(0, -2)}.${digits.slice(-2)}`
}

export function formatMinor(minor: number | bigint, currency: Currency): string {
  const decimal =
    typeof minor === "number" && !Number.isInteger(minor) ? (minor / 100).toFixed(2) : minorToDecimal(minor)
  return `${SYMBOLS[currency] ?? ""}${decimal}`
}

export function formatTransactionAmount(minor: number | bigint, currency: string): string {
  return isCurrency(currency) ? formatMinor(minor, currency) : `${minor} minor units (${currency || "empty currency"})`
}

export const CURRENCY_OPTIONS: { value: Currency; label: string }[] = [
  { value: "GBP", label: "£ GBP" },
  { value: "EUR", label: "€ EUR" },
]
