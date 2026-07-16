import {
  createAppointmentRepository,
  createTransaction as insertTransaction,
  deleteTransaction as removeTransaction,
  listTransactions as fetchTransactions,
  updateTransaction as patchTransaction,
} from "@prive-admin-tanstack/db"

import { badRequest, notFound, unexpectedError } from "../errors"

const appointments = createAppointmentRepository()

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
  const appointment = await appointments.get(input.appointmentId)
  if (!appointment) {
    throw notFound("Appointment not found")
  }

  const allowedCustomerIds = new Set<string>([
    appointment.clientId,
    ...appointment.personnel.map((personnel) => personnel.personnelId),
  ])
  if (!allowedCustomerIds.has(input.customerId)) {
    throw badRequest("Customer is not the appointment client or assigned personnel")
  }

  let result
  try {
    result = await insertTransaction(undefined, input)
  } catch (error) {
    throw unexpectedError("Failed to create transaction", error)
  }

  if (!result) {
    throw unexpectedError("Failed to create transaction")
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
  let result
  try {
    result = await patchTransaction(undefined, input)
  } catch (error) {
    throw unexpectedError("Failed to update transaction", error)
  }

  if (!result) {
    throw notFound("Transaction not found")
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
