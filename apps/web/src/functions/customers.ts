import { db } from "@prive-admin-tanstack/db"
import { customer } from "@prive-admin-tanstack/db/schema/customer"
import { createServerFn } from "@tanstack/react-start"
import { eq } from "drizzle-orm"
import { z } from "zod"

import { type Currency } from "@/lib/currency"
import { customerSchema } from "@/lib/schemas"
import { requireAuthMiddleware } from "@/middleware/auth"

export const getCustomers = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .handler(async () => {
    return db.query.customer.findMany({
      orderBy: (customer, { asc }) => [asc(customer.name)],
    })
  })

export const getCustomer = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const result = await db.query.customer.findFirst({
      where: eq(customer.id, data.id),
    })
    if (!result) {
      throw new Error("Customer not found")
    }
    return result
  })

export const createCustomer = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator(customerSchema)
  .handler(async ({ data }) => {
    const [result] = await db
      .insert(customer)
      .values({
        name: data.name,
        phoneNumber: data.phoneNumber,
      })
      .returning()
    return result
  })

export const updateCustomer = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator(customerSchema.required({ id: true }))
  .handler(async ({ data }) => {
    const [result] = await db
      .update(customer)
      .set({
        name: data.name,
        phoneNumber: data.phoneNumber,
      })
      .where(eq(customer.id, data.id!))
      .returning()
    return result
  })

export const getCustomerSummary = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const result = await db.query.customer.findFirst({
      where: eq(customer.id, data.id),
      columns: { createdAt: true },
      with: {
        appointmentsAsCustomer: { columns: { id: true } },
        transactions: { columns: { amount: true, currency: true } },
        hairAssigned: { columns: { profit: true, soldFor: true, weightInGrams: true } },
        notes: { columns: { id: true } },
      },
    })
    if (!result) {
      throw new Error("Customer not found")
    }
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
  })
