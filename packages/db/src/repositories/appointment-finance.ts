import { and, eq, exists, gte, isNotNull, lt, or, sql, type SQL } from "drizzle-orm"

import type { TransactionCurrency } from "../schema/transaction"

import { db, type Db } from "../client"
import { appointment, personnelOnAppointments } from "../schema/appointment"
import { customer } from "../schema/customer"
import { personnel } from "../schema/personnel"
import { transaction as movement } from "../schema/transaction"

export type FinancePeriod = { year: number; currency?: TransactionCurrency }
export type PersonnelFinanceFilter = { from: string; to: string; currency?: TransactionCurrency }

const transactionMonth = sql<number>`cast(strftime('%m', ${movement.createdAt} / 1000, 'unixepoch') as integer)`
type Page = { pageSize: number; offset: number }

function periodFilter({ year, month, currency }: FinancePeriod & { month?: number }) {
  const start = new Date(Date.UTC(year, (month ?? 1) - 1, 1))
  const end = new Date(Date.UTC(year, month ?? 12, 1))
  return and(
    isNotNull(movement.appointmentId),
    gte(movement.createdAt, start),
    lt(movement.createdAt, end),
    currency ? eq(movement.currency, currency) : undefined,
  )
}

function dateRangeFilter({ from, to, currency }: PersonnelFinanceFilter) {
  const start = new Date(`${from}T00:00:00.000Z`)
  const end = new Date(`${to}T00:00:00.000Z`)
  end.setUTCDate(end.getUTCDate() + 1)
  return and(
    isNotNull(movement.appointmentId),
    gte(movement.createdAt, start),
    lt(movement.createdAt, end),
    currency ? eq(movement.currency, currency) : undefined,
  )
}

// Split safe-integer minor units before SUM. Each signed part is below 10^8,
// so even one movement per byte of a 10 GiB D1 database fits in int64 per sum.
// SQLite formats both integers before they cross the JS number boundary.
function exactSum(amount: SQL, alias: string) {
  return sql<string>`printf('%lld %lld', sum((${amount}) / 100000000), sum((${amount}) % 100000000))`
    .mapWith((pair: string) => {
      const [high, low] = pair.split(" ")
      return (BigInt(high!) * 100000000n + BigInt(low!)).toString()
    })
    .as(alias)
}

const totals = { total: exactSum(sql`${movement.amount}`, "total") }

export function appointmentFinanceRows(database: Db = db, appointmentId: string) {
  return database
    .select({ currency: movement.currency, ...totals })
    .from(movement)
    .where(eq(movement.appointmentId, appointmentId))
    .groupBy(movement.currency)
    .orderBy(movement.currency)
}

function pageColumns(order: SQL) {
  return {
    position: sql<number>`row_number() over (order by ${order})`.as("position"),
    totalCount: sql<number>`count(*) over ()`.as("totalCount"),
  }
}

function pageFilter({ offset, pageSize }: Page) {
  // On an out-of-range request return one row carrying the count from the same snapshot.
  return sql`(position between ${offset + 1} and ${offset + pageSize}) or (position = 1 and totalCount <= ${offset})`
}

function unpackPage<T extends { totalCount: number; position: number }>(rows: T[], offset: number) {
  return {
    totalCount: rows[0]?.totalCount ?? 0,
    items: rows.flatMap(({ totalCount: _totalCount, position, ...item }) => (position > offset ? [item] : [])),
  }
}

export async function monthlyFinanceRows(database: Db = db, input: FinancePeriod & Page) {
  const groups = database
    .select({
      month: transactionMonth.as("month"),
      currency: movement.currency,
      ...totals,
      ...pageColumns(sql`${transactionMonth}, ${movement.currency}`),
    })
    .from(movement)
    .where(periodFilter(input))
    .groupBy(transactionMonth, movement.currency)
    .as("monthly_groups")
  const rows = await database
    .select()
    .from(groups)
    .where(pageFilter(input))
    .orderBy(sql`${groups.position}`)
  return unpackPage(rows, input.offset)
}

export async function personnelAllocationRows(database: Db = db, input: PersonnelFinanceFilter & Page) {
  const groups = database
    .select({
      personnelId: movement.customerId,
      personnelName: customer.name,
      personnelType: personnel.type,
      currency: movement.currency,
      appointmentCount: sql<number>`count(distinct ${appointment.id})`.as("appointmentCount"),
      paid: exactSum(sql`case when ${movement.amount} < 0 then -${movement.amount} else 0 end`, "paid"),
      credits: exactSum(sql`case when ${movement.amount} > 0 then ${movement.amount} else 0 end`, "credits"),
      ...pageColumns(sql`${customer.name}, ${movement.currency}, ${movement.customerId}`),
    })
    .from(movement)
    .innerJoin(appointment, eq(appointment.id, movement.appointmentId))
    .leftJoin(customer, eq(customer.id, movement.customerId))
    .innerJoin(personnel, eq(personnel.customerId, movement.customerId))
    .where(
      and(
        dateRangeFilter(input),
        or(
          eq(movement.customerId, appointment.masterId),
          exists(
            database
              .select({ appointmentId: personnelOnAppointments.appointmentId })
              .from(personnelOnAppointments)
              .where(
                and(
                  eq(personnelOnAppointments.appointmentId, appointment.id),
                  eq(personnelOnAppointments.personnelId, movement.customerId),
                ),
              ),
          ),
        ),
      ),
    )
    .groupBy(customer.name, personnel.type, movement.currency, movement.customerId)
    .as("personnel_groups")
  const rows = await database
    .select()
    .from(groups)
    .where(pageFilter(input))
    .orderBy(sql`${groups.position}`)
  return unpackPage(rows, input.offset)
}
