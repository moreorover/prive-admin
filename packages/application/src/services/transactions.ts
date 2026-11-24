import {
  createTransaction as insertTransaction,
  deleteTransaction as removeTransaction,
  getAppointment as findAppointment,
  getTransaction as findTransaction,
  listTransactions as fetchTransactions,
  resolveTransactionCurrency as patchCurrency,
  updateTransaction as patchTransaction,
} from "@prive-admin-tanstack/db"

import { badRequest, conflict, notFound, unexpectedError } from "../errors"

export async function listTransactions(input: {
  pageSize: number
  offset: number
  appointmentId?: string
  customerId?: string
  currency?: "GBP" | "EUR"
}) {
  return fetchTransactions(undefined, input)
}

export async function createTransaction(input: {
  appointmentId: string
  customerId: string
  name?: string | null
  notes?: string | null
  amount: number
  currency: "GBP" | "EUR"
}) {
  const appointment = await findAppointment(undefined, input.appointmentId)
  if (!appointment) throw notFound("Appointment not found")
  const allowedCustomerIds = new Set<string>([
    appointment.clientId,
    appointment.masterId,
    ...appointment.personnel.map((personnel) => personnel.personnelId),
  ])
  if (!allowedCustomerIds.has(input.customerId)) {
    throw badRequest("Customer is not the appointment client, master, or assigned personnel")
  }
  let result
  try {
    result = await insertTransaction(undefined, input)
  } catch (error) {
    throw unexpectedError("Failed to create transaction", error)
  }

  if (!result) {
    throw conflict("Appointment counterparty eligibility changed before the movement was recorded")
  }

  return result
}

export async function updateTransaction(input: {
  id: string
  name?: string | null
  notes?: string | null
  amount: number
  currency: "GBP" | "EUR"
}) {
  const existing = await findTransaction(undefined, input.id)
  if (!existing) throw notFound("Transaction not found")
  if (existing.currency !== "EUR" && existing.currency !== "GBP") {
    throw badRequest("The owner must resolve the stored currency before editing this transaction")
  }
  let result
  try {
    result = await patchTransaction(undefined, input)
  } catch (error) {
    throw unexpectedError("Failed to update transaction", error)
  }

  if (!result) {
    throw conflict("Transaction currency or counterparty eligibility changed before the movement was updated")
  }

  return result
}

export async function deleteTransaction(id: string) {
  let result
  try {
    result = await removeTransaction(undefined, id)
  } catch (error) {
    throw unexpectedError("Failed to delete transaction", error)
  }

  if (!result) {
    throw notFound("Transaction not found")
  }

  return result
}

export async function resolveTransactionCurrency(input: {
  id: string
  storedCurrency: string
  currency: "EUR" | "GBP"
}) {
  if (input.storedCurrency === "EUR" || input.storedCurrency === "GBP")
    throw badRequest("This currency is already supported")
  let result
  try {
    result = await patchCurrency(undefined, input)
  } catch (error) {
    throw unexpectedError("Failed to resolve transaction currency", error)
  }
  if (!result) throw conflict("The reviewed transaction or currency has changed")
  return result
}
