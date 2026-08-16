import { and, eq, gte, isNotNull, isNull, lt, sql } from "drizzle-orm"

import { db, type Db } from "../index"
import { appointment } from "../schema/appointment"
import { hairAssigned } from "../schema/hair"
import { transaction } from "../schema/transaction"

function monthFromTimestampMs(column: typeof appointment.startsAt | typeof hairAssigned.soldAt) {
  return sql<number>`cast(strftime('%m', ${column} / 1000, 'unixepoch') as integer)`
}

export async function transactionMonthlyRows(database: Db = db, input: { year: number; legalEntityId?: string }) {
  const yearStart = new Date(Date.UTC(input.year, 0, 1))
  const yearEnd = new Date(Date.UTC(input.year + 1, 0, 1))
  return database
    .select({
      currency: transaction.currency,
      month: monthFromTimestampMs(appointment.startsAt),
      sum: sql<number>`coalesce(sum(${transaction.amount}), 0)`,
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
    .groupBy(transaction.currency, monthFromTimestampMs(appointment.startsAt))
}

export async function hairAssignedMonthlyRows(database: Db = db, input: { year: number }) {
  const yearStart = new Date(Date.UTC(input.year, 0, 1))
  const yearEnd = new Date(Date.UTC(input.year + 1, 0, 1))
  return database
    .select({
      month: monthFromTimestampMs(hairAssigned.soldAt),
      weight: sql<number>`coalesce(sum(${hairAssigned.weightInGrams}), 0)`,
      soldFor: sql<number>`coalesce(sum(${hairAssigned.soldFor}), 0)`,
      profit: sql<number>`coalesce(sum(${hairAssigned.profit}), 0)`,
      pricePerGram: sql<number>`coalesce(avg(${hairAssigned.pricePerGram}), 0)`,
    })
    .from(hairAssigned)
    .where(
      and(isNotNull(hairAssigned.appointmentId), gte(hairAssigned.soldAt, yearStart), lt(hairAssigned.soldAt, yearEnd)),
    )
    .groupBy(monthFromTimestampMs(hairAssigned.soldAt))
}

export async function hairAssignedThroughSaleMonthlyRows(database: Db = db, input: { year: number }) {
  const yearStart = new Date(Date.UTC(input.year, 0, 1))
  const yearEnd = new Date(Date.UTC(input.year + 1, 0, 1))
  return database
    .select({
      month: monthFromTimestampMs(hairAssigned.soldAt),
      weight: sql<number>`coalesce(sum(${hairAssigned.weightInGrams}), 0)`,
      soldFor: sql<number>`coalesce(sum(${hairAssigned.soldFor}), 0)`,
      profit: sql<number>`coalesce(sum(${hairAssigned.profit}), 0)`,
      pricePerGram: sql<number>`coalesce(avg(${hairAssigned.pricePerGram}), 0)`,
    })
    .from(hairAssigned)
    .where(
      and(isNull(hairAssigned.appointmentId), gte(hairAssigned.soldAt, yearStart), lt(hairAssigned.soldAt, yearEnd)),
    )
    .groupBy(monthFromTimestampMs(hairAssigned.soldAt))
}
