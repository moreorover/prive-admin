import { CURRENCIES, type Currency } from "@/lib/currency"

export function coerceCashTransactionCurrency(currency: string): Currency {
  return (CURRENCIES as readonly string[]).includes(currency) ? (currency as Currency) : "EUR"
}
