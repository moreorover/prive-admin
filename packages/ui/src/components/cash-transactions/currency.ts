import { CURRENCIES, type Currency } from "@prive-admin-tanstack/ui/lib/currency"

export function coerceCashTransactionCurrency(currency: string): Currency {
  return (CURRENCIES as readonly string[]).includes(currency) ? (currency as Currency) : "EUR"
}
