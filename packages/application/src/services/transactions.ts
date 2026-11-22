import type { TransactionMovementType } from "@prive-admin-tanstack/db/schema/transaction"

import {
  createTransaction as insertTransaction,
  deleteTransaction as removeTransaction,
  getAppointment as findAppointment,
  getTransaction as findTransaction,
  listTransactions as fetchTransactions,
  updateTransaction as patchTransaction,
} from "@prive-admin-tanstack/db"

import { badRequest, notFound, unexpectedError } from "../errors"

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
  movementType: TransactionMovementType
  amount: number
  currency: "GBP" | "EUR"
}) {
  validateMovement(input)
  const appointment = await findAppointment(undefined, input.appointmentId)
  if (!appointment) {
    throw notFound("Appointment not found")
  }

  if (input.movementType === "personnel_allocation") {
    validateAllocationRecipient(appointment, input.customerId)
  } else {
    const allowedCustomerIds = new Set([
      appointment.clientId,
      ...appointment.personnel.map((personnel) => personnel.personnelId),
    ])
    if (!allowedCustomerIds.has(input.customerId)) {
      throw badRequest("Customer is not the appointment client or assigned personnel")
    }
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
  movementType: TransactionMovementType
  amount: number
  currency: "GBP" | "EUR"
}) {
  validateMovement(input)
  if (input.movementType === "personnel_allocation") {
    const existing = await findTransaction(undefined, input.id)
    if (!existing) throw notFound("Transaction not found")
    if (!existing.appointmentId || !existing.customerId) {
      throw badRequest("Personnel allocations require an appointment and recipient")
    }
    const appointment = await findAppointment(undefined, existing.appointmentId)
    if (!appointment) throw notFound("Appointment not found")
    validateAllocationRecipient(appointment, existing.customerId)
  }

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

function validateMovement(input: { movementType: TransactionMovementType; amount: number }) {
  if (!Number.isSafeInteger(input.amount) || input.amount === 0) {
    throw badRequest("Amount must be a nonzero safe integer in minor units")
  }
  switch (input.movementType) {
    case "received":
      if (input.amount < 0) throw badRequest("Received movements must be positive")
      break
    case "personnel_allocation":
    case "refund":
      if (input.amount > 0) throw badRequest("Allocations and refunds must be negative")
      break
    case "adjustment":
      break
    default:
      throw badRequest("An explicit transaction movement type is required")
  }
}

function validateAllocationRecipient(
  appointment: { masterId: string; personnel: { personnelId: string }[] },
  customerId: string,
) {
  if (appointment.masterId !== customerId && !appointment.personnel.some((row) => row.personnelId === customerId)) {
    throw badRequest("Personnel allocation recipient is not the appointment master or assigned personnel")
  }
}
