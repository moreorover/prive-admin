import { z } from "zod"

export const CURRENCIES = ["GBP", "EUR"] as const
export type Currency = (typeof CURRENCIES)[number]

export const currencySchema = z.enum(CURRENCIES)

const SYMBOLS: Record<Currency, string> = {
  GBP: "£",
  EUR: "€",
}

export const currencySymbol = (currency: Currency): string => SYMBOLS[currency]

export const formatMinor = (minor: number, currency: Currency): string =>
  `${SYMBOLS[currency]}${(minor / 100).toFixed(2)}`

export const CURRENCY_OPTIONS: { value: Currency; label: string }[] = [
  { value: "GBP", label: "£ GBP" },
  { value: "EUR", label: "€ EUR" },
]
