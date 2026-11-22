import { and, count, eq, gte, inArray, isNotNull, lt, sql } from "drizzle-orm"

import { db, type Db } from "../client"
import { customer } from "../schema/customer"
import { transaction as movement, transactionMovementTypes, type TransactionMovementType } from "../schema/transaction"

export type FinancePeriod = { year: number; currency?: string }
export type PersonnelFinanceFilter = FinancePeriod & { month?: number; personnelId?: string }

const transactionMonth = sql<number>`cast(strftime('%m', ${movement.createdAt} / 1000, 'unixepoch') as integer)`
const classified = inArray(movement.movementType, transactionMovementTypes)

function movementSum(type: TransactionMovementType) {
  return sql<string>`cast(coalesce(sum(${movement.amount}) filter (where ${movement.movementType} = ${type}), 0) as text)`
}

const totals = {
  currency: movement.currency,
  received: movementSum("received"),
  refunds: sql<string>`cast(-coalesce(sum(${movement.amount}) filter (where ${movement.movementType} = 'refund'), 0) as text)`,
  adjustments: movementSum("adjustment"),
  personnelAllocations: sql<string>`cast(-coalesce(sum(${movement.amount}) filter (where ${movement.movementType} = 'personnel_allocation'), 0) as text)`,
}

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

export function appointmentFinanceRows(database: Db = db, appointmentId: string) {
  return database
    .select(totals)
    .from(movement)
    .where(and(eq(movement.appointmentId, appointmentId), classified))
    .groupBy(movement.currency)
    .orderBy(movement.currency)
}

export function monthlyFinanceRows(database: Db = db, input: FinancePeriod) {
  return database
    .select({ month: transactionMonth, ...totals })
    .from(movement)
    .where(and(periodFilter(input), classified))
    .groupBy(transactionMonth, movement.currency)
    .orderBy(transactionMonth, movement.currency)
}

export async function personnelAllocationRows(
  database: Db = db,
  input: PersonnelFinanceFilter & { pageSize: number; offset: number },
) {
  const groups = database
    .select({
      month: transactionMonth.as("month"),
      personnelId: movement.customerId,
      personnelName: customer.name,
      currency: movement.currency,
      allocated: sql<string>`cast(-sum(${movement.amount}) as text)`.as("allocated"),
    })
    .from(movement)
    .leftJoin(customer, eq(customer.id, movement.customerId))
    .where(
      and(
        periodFilter(input),
        eq(movement.movementType, "personnel_allocation"),
        input.personnelId ? eq(movement.customerId, input.personnelId) : undefined,
      ),
    )
    .groupBy(transactionMonth, movement.customerId, movement.currency)
    .as("allocations")
  const [items, [size]] = await Promise.all([
    database
      .select()
      .from(groups)
      .orderBy(sql`${groups.month}`, groups.personnelName, groups.personnelId, groups.currency)
      .limit(input.pageSize)
      .offset(input.offset),
    database.select({ totalCount: count() }).from(groups),
  ])
  return { items, totalCount: size?.totalCount ?? 0 }
}
