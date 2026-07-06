import {
  createCustomer as insertCustomer,
  getCustomer as findCustomer,
  getCustomerSummary as fetchCustomerSummary,
  listCustomerAppointments as fetchCustomerAppointments,
  listCustomerHairAssigned as fetchCustomerHairAssigned,
  listCustomerNotes as fetchCustomerNotes,
  listCustomers as fetchCustomers,
  updateCustomer as patchCustomer,
} from "@prive-admin-tanstack/db"

import { notFound, unexpectedError } from "../errors"

type Currency = "GBP" | "EUR"

type CustomerSummaryRow = {
  createdAt: Date
  appointmentsAsCustomer: Array<{ id: string }>
  transactions: Array<{ amount: number; currency: string }>
  hairAssigned: Array<{ profit: number; soldFor: number; weightInGrams: number }>
  notes: Array<{ id: string }>
}

export async function listCustomers(input: { pageSize: number; offset: number; search?: string }) {
  return fetchCustomers(undefined, input)
}

export async function listCustomerAppointments(input: { customerId: string; pageSize: number; offset: number }) {
  return fetchCustomerAppointments(undefined, input)
}

export async function listCustomerNotes(input: { customerId: string }) {
  return fetchCustomerNotes(undefined, input)
}

export async function listCustomerHairAssigned(input: { customerId: string; pageSize: number; offset: number }) {
  return fetchCustomerHairAssigned(undefined, input)
}

export async function getCustomer(id: string) {
  const result = await findCustomer(undefined, id)
  if (!result) throw notFound("Customer not found")
  return result
}

export async function createCustomer(input: { name: string; phoneNumber?: string | null }) {
  let result
  try {
    result = await insertCustomer(undefined, input)
  } catch (error) {
    throw unexpectedError("Failed to create customer", error)
  }

  if (!result) {
    throw unexpectedError("Failed to create customer")
  }

  return result
}

export async function updateCustomer(input: { id: string; name: string; phoneNumber?: string | null }) {
  let result
  try {
    result = await patchCustomer(undefined, input)
  } catch (error) {
    throw unexpectedError("Failed to update customer", error)
  }

  if (!result) throw notFound("Customer not found")
  return result
}

export async function getCustomerSummary(id: string) {
  const result = (await fetchCustomerSummary(undefined, id)) as CustomerSummaryRow | null
  if (!result) throw notFound("Customer not found")

  const transactionSumsMinor: Record<Currency, number> = { GBP: 0, EUR: 0 }
  for (const t of result.transactions) {
    const currency = t.currency as Currency
    if (currency in transactionSumsMinor) {
      transactionSumsMinor[currency] += t.amount
    }
  }

  const hairAssignedProfitSumCents = result.hairAssigned.reduce((acc, ha) => acc + ha.profit, 0)
  const hairAssignedSoldForSumCents = result.hairAssigned.reduce((acc, ha) => acc + ha.soldFor, 0)
  const hairAssignedWeightInGramsSum = result.hairAssigned.reduce((acc, ha) => acc + ha.weightInGrams, 0)

  return {
    appointmentCount: result.appointmentsAsCustomer.length,
    transactionSumsMinor,
    hairAssignedProfitSum: hairAssignedProfitSumCents / 100,
    hairAssignedSoldForSum: hairAssignedSoldForSumCents / 100,
    hairAssignedWeightInGramsSum,
    noteCount: result.notes.length,
    customerCreatedAt: result.createdAt,
  }
}
