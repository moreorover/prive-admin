import { type Currency } from "@/lib/currency"

export const CASH_TRANSACTIONS_PAGE_SIZE = 25
export const defaultCashCustomersListInput = { page: 1, pageSize: 100, search: undefined as string | undefined }

export type CashTransactionDirection = "all" | "received" | "paid"
export type CashTransactionCurrencyFilter = Currency | ""
export type CashTransactionFilters = {
  search: string
  customerId: string
  currency: CashTransactionCurrencyFilter
  direction: CashTransactionDirection
  dateFrom: string
  dateTo: string
}
