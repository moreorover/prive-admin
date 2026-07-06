import { asc, count, desc, eq, ilike, or } from "drizzle-orm"

import { db, type Db } from "../index"
import { customer } from "../schema"
import { appointment } from "../schema/appointment"
import { hairAssigned } from "../schema/hair"
import { note } from "../schema/note"

export type CustomerListFilter = {
  pageSize: number
  offset: number
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

export async function listCustomers(database: Db = db, filter: CustomerListFilter) {
  const where = filter.search
    ? or(
        ilike(customer.name, `%${escapeLikePattern(filter.search)}%`),
        ilike(customer.phoneNumber, `%${escapeLikePattern(filter.search)}%`),
      )
    : undefined

  const items = await database
    .select()
    .from(customer)
    .where(where)
    .orderBy(asc(customer.name))
    .limit(filter.pageSize)
    .offset(filter.offset)

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

export async function listCustomerAppointments(
  database: Db = db,
  input: { customerId: string; pageSize: number; offset: number },
) {
  const where = eq(appointment.clientId, input.customerId)

  const items = await database.query.appointment.findMany({
    where,
    with: { client: true, master: true, salon: true },
    orderBy: (a) => [desc(a.startsAt)],
    limit: input.pageSize,
    offset: input.offset,
  })

  const [countRow] = await database.select({ totalCount: count() }).from(appointment).where(where)
  return { items, totalCount: countRow?.totalCount ?? 0 }
}

export async function listCustomerNotes(database: Db = db, input: { customerId: string }) {
  return database.query.note.findMany({
    where: eq(note.customerId, input.customerId),
    with: { createdBy: true },
    orderBy: (n) => [desc(n.createdAt)],
  })
}

export async function listCustomerHairAssigned(
  database: Db = db,
  input: { customerId: string; pageSize: number; offset: number },
) {
  const where = eq(hairAssigned.clientId, input.customerId)

  const items = await database.query.hairAssigned.findMany({
    where,
    with: { client: true, hairOrder: true },
    orderBy: (ha) => [desc(ha.createdAt)],
    limit: input.pageSize,
    offset: input.offset,
  })

  const [countRow] = await database.select({ totalCount: count() }).from(hairAssigned).where(where)
  return { items, totalCount: countRow?.totalCount ?? 0 }
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
