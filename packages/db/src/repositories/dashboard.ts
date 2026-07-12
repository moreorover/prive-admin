import { and, eq, gte, isNotNull, isNull, lt, sql } from "drizzle-orm"

import { db, type Db } from "../index"
import { appointment } from "../schema/appointment"
import { hairAssigned } from "../schema/hair"
import { transaction } from "../schema/transaction"

export async function transactionMonthlyRows(database: Db = db, input: { year: number; legalEntityId?: string }) {
  const yearStart = new Date(Date.UTC(input.year, 0, 1))
  const yearEnd = new Date(Date.UTC(input.year + 1, 0, 1))
  return database
    .select({
      currency: transaction.currency,
      month: sql<number>`extract(month from ${appointment.startsAt})::int`,
      sum: sql<number>`coalesce(sum(${transaction.amount}), 0)::int`,
    })
    .from(transaction)
    .innerJoin(appointment, eq(transaction.appointmentId, appointment.id))
    .where(
      and(
        gte(appointment.startsAt, yearStart),
        lt(appointment.startsAt, yearEnd),
        isNotNull(transaction.appointmentId),
      ),
    )
    .groupBy(transaction.currency, sql`extract(month from ${appointment.startsAt})`)
}

export async function hairAssignedMonthlyRows(database: Db = db, input: { year: number }) {
  const yearStart = new Date(Date.UTC(input.year, 0, 1))
  const yearEnd = new Date(Date.UTC(input.year + 1, 0, 1))
  return database
    .select({
      month: sql<number>`extract(month from ${appointment.startsAt})::int`,
      weight: sql<number>`coalesce(sum(${hairAssigned.weightInGrams}), 0)::int`,
      soldFor: sql<number>`coalesce(sum(${hairAssigned.soldFor}), 0)::int`,
      profit: sql<number>`coalesce(sum(${hairAssigned.profit}), 0)::int`,
      pricePerGram: sql<number>`coalesce(avg(${hairAssigned.pricePerGram}), 0)::int`,
    })
    .from(hairAssigned)
    .innerJoin(appointment, eq(hairAssigned.appointmentId, appointment.id))
    .where(and(gte(appointment.startsAt, yearStart), lt(appointment.startsAt, yearEnd)))
    .groupBy(sql`extract(month from ${appointment.startsAt})`)
}

export async function hairAssignedThroughSaleMonthlyRows(database: Db = db, input: { year: number }) {
  const yearStart = new Date(Date.UTC(input.year, 0, 1))
  const yearEnd = new Date(Date.UTC(input.year + 1, 0, 1))
  return database
    .select({
      month: sql<number>`extract(month from ${hairAssigned.createdAt})::int`,
      weight: sql<number>`coalesce(sum(${hairAssigned.weightInGrams}), 0)::int`,
      soldFor: sql<number>`coalesce(sum(${hairAssigned.soldFor}), 0)::int`,
      profit: sql<number>`coalesce(sum(${hairAssigned.profit}), 0)::int`,
      pricePerGram: sql<number>`coalesce(avg(${hairAssigned.pricePerGram}), 0)::int`,
    })
    .from(hairAssigned)
    .where(
      and(
        isNull(hairAssigned.appointmentId),
        gte(hairAssigned.createdAt, yearStart),
        lt(hairAssigned.createdAt, yearEnd),
      ),
    )
    .groupBy(sql`extract(month from ${hairAssigned.createdAt})`)
}
