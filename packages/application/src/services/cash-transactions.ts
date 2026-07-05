import {
  createCashTransaction as insertCashTransaction,
  deleteCashTransaction as removeCashTransaction,
  listCashTransactions as fetchCashTransactions,
  updateCashTransaction as patchCashTransaction,
} from "@prive-admin-tanstack/db"

import { notFound, unexpectedError } from "../errors"

export async function listCashTransactions(input: {
  pageSize: number
  offset: number
  search?: string
  customerId?: string
  currency?: "EUR" | "GBP"
  direction?: "all" | "received" | "paid"
  dateFrom?: string
  dateTo?: string
}) {
  return fetchCashTransactions(undefined, input)
}

export async function createCashTransaction(input: {
  customerId: string
  createdById: string
  createdAt: string
  description?: string | null
  notes?: string | null
  amount: number
  currency: "EUR" | "GBP"
}) {
  let result
  try {
    result = await insertCashTransaction(undefined, input)
  } catch (error) {
    throw unexpectedError("Failed to create cash transaction", error)
  }

  if (!result) {
    throw unexpectedError("Failed to create cash transaction")
  }

  return result
}

export async function updateCashTransaction(input: {
  id: string
  customerId: string
  createdAt: string
  description?: string | null
  notes?: string | null
  amount: number
  currency: "EUR" | "GBP"
}) {
  let result
  try {
    result = await patchCashTransaction(undefined, input)
  } catch (error) {
    throw unexpectedError("Failed to update cash transaction", error)
  }

  if (!result) {
    throw notFound("Cash transaction not found")
  }

  return result
}

export async function deleteCashTransaction(id: string) {
  try {
    return await removeCashTransaction(undefined, id)
  } catch (error) {
    throw unexpectedError("Failed to delete cash transaction", error)
  }
}
