import { and, asc, count, desc, eq, like, or, sql } from "drizzle-orm"

import { db, type Db } from "../index"
import { customer } from "../schema"
import { appointment, personnelOnAppointments } from "../schema/appointment"
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
        like(customer.name, `%${escapeLikePattern(filter.search)}%`),
        like(customer.phoneNumber, `%${escapeLikePattern(filter.search)}%`),
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
  input: { customerId: string; pageSize: number; offset: number; search?: string },
) {
  const customerRoleWhere = or(
    eq(appointment.clientId, input.customerId),
    eq(appointment.masterId, input.customerId),
    sql<boolean>`exists (
      select 1
      from ${personnelOnAppointments}
      where "appointment_personnel"."appointment_id" = ${appointment.id}
        and "appointment_personnel"."personnel_id" = ${input.customerId}
    )`,
  )
  const where = input.search
    ? and(customerRoleWhere, like(appointment.name, `%${escapeLikePattern(input.search)}%`))
    : customerRoleWhere

  const items = await database.query.appointment.findMany({
    where,
    with: { client: true, master: true, salon: true, personnel: { with: { personnel: true } } },
    orderBy: (a) => [desc(a.startsAt)],
    limit: input.pageSize,
    offset: input.offset,
  })

  const [countRow] = await database.select({ totalCount: count() }).from(appointment).where(where)
  return { items, totalCount: countRow?.totalCount ?? 0 }
}

export async function listCustomerNotes(
  database: Db = db,
  input: { customerId: string; pageSize: number; offset: number; search?: string },
) {
  const where = input.search
    ? and(eq(note.customerId, input.customerId), like(note.note, `%${escapeLikePattern(input.search)}%`))
    : eq(note.customerId, input.customerId)

  const items = await database.query.note.findMany({
    where,
    with: { createdBy: true },
    orderBy: (n) => [desc(n.createdAt)],
    limit: input.pageSize,
    offset: input.offset,
  })

  const [countRow] = await database.select({ totalCount: count() }).from(note).where(where)
  return { items, totalCount: countRow?.totalCount ?? 0 }
}

export async function listCustomerHairAssigned(
  database: Db = db,
  input: { customerId: string; pageSize: number; offset: number; search?: string },
) {
  const where = input.search
    ? and(
        eq(hairAssigned.clientId, input.customerId),
        // Hair-sale search targets the linked hair order UID because it is the stable human-facing identifier.
        sql<boolean>`exists (
          select 1
          from hair_order
          where hair_order.id = ${hairAssigned.hairOrderId}
            and cast(hair_order.uid as text) like ${`%${escapeLikePattern(input.search)}%`}
        )`,
      )
    : eq(hairAssigned.clientId, input.customerId)

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
