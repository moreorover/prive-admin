import { asc, count, eq, ilike, or } from "drizzle-orm"

import { db, type Db } from "../index"
import { customer } from "../schema/customer"

export type CustomerListFilter = {
  search?: string
}

export type CustomerUpsertInput = {
  id?: string
  name: string
  phoneNumber?: string | null
}

function escapeLikePattern(value: string) {
  return value.replace(/[\\%_]/g, "\\$&")
}

export async function listCustomers(database: Db = db, filter: CustomerListFilter = {}) {
  const where = filter.search
    ? or(
        ilike(customer.name, `%${escapeLikePattern(filter.search)}%`),
        ilike(customer.phoneNumber, `%${escapeLikePattern(filter.search)}%`),
      )
    : undefined

  const items = await database.select().from(customer).where(where).orderBy(asc(customer.name))

  const [countRow] = await database.select({ totalCount: count() }).from(customer).where(where)
  return { items, totalCount: countRow?.totalCount ?? 0 }
}

export async function getCustomer(database: Db = db, id: string) {
  return database.query.customer.findFirst({ where: eq(customer.id, id) })
}

export async function getCustomerSummary(database: Db = db, id: string) {
  return database.query.customer.findFirst({
    where: eq(customer.id, id),
    columns: { createdAt: true },
    with: {
      appointmentsAsCustomer: { columns: { id: true } },
      transactions: { columns: { amount: true, currency: true } },
      hairAssigned: { columns: { profit: true, soldFor: true, weightInGrams: true } },
      notes: { columns: { id: true } },
    },
  })
}

export async function createCustomer(database: Db = db, input: CustomerUpsertInput) {
  const [result] = await database
    .insert(customer)
    .values({
      name: input.name,
      phoneNumber: input.phoneNumber ?? null,
    })
    .returning()
  return result
}

export async function updateCustomer(
  database: Db = db,
  input: Required<Pick<CustomerUpsertInput, "id">> & CustomerUpsertInput,
) {
  const [result] = await database
    .update(customer)
    .set({
      name: input.name,
      phoneNumber: input.phoneNumber ?? null,
    })
    .where(eq(customer.id, input.id))
    .returning()
  return result
}
