import type { TransactionMovementType } from "@prive-admin-tanstack/db/schema/transaction"

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
import { assertActivePersonnel } from "./personnel"

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
  await validateCounterparty(input.appointmentId, input.customerId, input.movementType)

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
  movementType: TransactionMovementType
  amount: number
  currency: "GBP" | "EUR"
}) {
  validateMovement(input)
  const existing = await findTransaction(undefined, input.id)
  if (!existing) throw notFound("Transaction not found")
  if (existing.currency !== "EUR" && existing.currency !== "GBP") {
    throw badRequest("The owner must resolve the stored currency before editing this transaction")
  }
  if (!existing.appointmentId || !existing.customerId) throw badRequest("An appointment and counterparty are required")
  await validateCounterparty(existing.appointmentId, existing.customerId, input.movementType)

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

async function validateCounterparty(appointmentId: string, customerId: string, movementType: TransactionMovementType) {
  const appointment = await findAppointment(undefined, appointmentId)
  if (!appointment) throw notFound("Appointment not found")
  const supportsAppointment = appointment.personnel.some((row) => row.personnelId === customerId)
  if (movementType === "personnel_allocation") {
    if (!supportsAppointment && appointment.masterId !== customerId) {
      throw badRequest("Personnel allocation recipient is not the appointment master or assigned personnel")
    }
    await assertActivePersonnel(customerId, supportsAppointment ? {} : { type: "master" })
  } else if (!supportsAppointment && appointment.clientId !== customerId) {
    throw badRequest("Customer is not the appointment client or assigned personnel")
  }
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
