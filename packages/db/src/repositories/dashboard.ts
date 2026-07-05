import { and, eq, gte, isNull, lt, sql } from "drizzle-orm"

import { db, type Db } from "../index"
import { appointment } from "../schema/appointment"
import { bankAccount } from "../schema/bank-account"
import { bankStatementEntry } from "../schema/bank-statement-entry"
import { hairAssigned } from "../schema/hair"

export async function transactionMonthlyRows(database: Db = db, input: { year: number; legalEntityId?: string }) {
  const yearStart = `${input.year}-01-01`
  const yearEnd = `${input.year + 1}-01-01`
  return database
    .select({
      currency: bankStatementEntry.currency,
      month: sql<number>`extract(month from ${bankStatementEntry.date})::int`,
      sum: sql<number>`coalesce(sum(
        case
          when ${bankStatementEntry.direction} = 'C' then ${bankStatementEntry.amount}
          when ${bankStatementEntry.direction} = 'D' then -${bankStatementEntry.amount}
          else 0
        end
      ), 0)::int`,
    })
    .from(bankStatementEntry)
    .innerJoin(bankAccount, eq(bankStatementEntry.bankAccountId, bankAccount.id))
    .where(
      and(
        gte(bankStatementEntry.date, yearStart),
        lt(bankStatementEntry.date, yearEnd),
        input.legalEntityId ? eq(bankAccount.legalEntityId, input.legalEntityId) : undefined,
      ),
    )
    .groupBy(bankStatementEntry.currency, sql`extract(month from ${bankStatementEntry.date})`)
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
