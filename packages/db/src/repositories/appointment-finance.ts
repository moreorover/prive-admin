import { and, eq, gte, inArray, isNotNull, lt, sql } from "drizzle-orm"

import { db, type Db } from "../client"
import { customer } from "../schema/customer"
import { transaction as movement, transactionMovementTypes } from "../schema/transaction"

export type FinancePeriod = { year: number; currency?: string }
export type PersonnelFinanceFilter = FinancePeriod & { month?: number; personnelId?: string }

const transactionMonth = sql<number>`cast(strftime('%m', ${movement.createdAt} / 1000, 'unixepoch') as integer)`
const classified = inArray(movement.movementType, transactionMovementTypes)

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

type MovementRow = { currency: string; movementType: string; amount: string }
type FinanceTotals = {
  currency: string
  received: string
  refunds: string
  adjustments: string
  personnelAllocations: string
}

function addMovement(totals: FinanceTotals, row: MovementRow) {
  const amount = BigInt(row.amount)
  if (row.movementType === "received") totals.received = (BigInt(totals.received) + amount).toString()
  if (row.movementType === "refund") totals.refunds = (BigInt(totals.refunds) - amount).toString()
  if (row.movementType === "adjustment") totals.adjustments = (BigInt(totals.adjustments) + amount).toString()
  if (row.movementType === "personnel_allocation") {
    totals.personnelAllocations = (BigInt(totals.personnelAllocations) - amount).toString()
  }
}

function createTotals(currency: string): FinanceTotals {
  return { currency, received: "0", refunds: "0", adjustments: "0", personnelAllocations: "0" }
}

function aggregateRows(rows: MovementRow[]) {
  const byCurrency = new Map<string, FinanceTotals>()
  for (const row of rows) {
    const totals = byCurrency.get(row.currency) ?? createTotals(row.currency)
    addMovement(totals, row)
    byCurrency.set(row.currency, totals)
  }
  return [...byCurrency.values()].sort((left, right) => left.currency.localeCompare(right.currency))
}

export async function appointmentFinanceRows(database: Db = db, appointmentId: string) {
  const rows = await database
    .select({
      currency: movement.currency,
      movementType: movement.movementType,
      amount: sql<string>`cast(${movement.amount} as text)`,
    })
    .from(movement)
    .where(and(eq(movement.appointmentId, appointmentId), classified))
  return aggregateRows(rows)
}

export async function monthlyFinanceRows(database: Db = db, input: FinancePeriod) {
  const rows = await database
    .select({
      month: transactionMonth,
      currency: movement.currency,
      movementType: movement.movementType,
      amount: sql<string>`cast(${movement.amount} as text)`,
    })
    .from(movement)
    .where(and(periodFilter(input), classified))
  const byMonth = new Map<string, FinanceTotals & { month: number }>()
  for (const row of rows) {
    const key = `${row.month}:${row.currency}`
    const totals = byMonth.get(key) ?? { ...createTotals(row.currency), month: row.month }
    addMovement(totals, row)
    byMonth.set(key, totals)
  }
  return [...byMonth.values()].sort(
    (left, right) => left.month - right.month || left.currency.localeCompare(right.currency),
  )
}

export async function personnelAllocationRows(
  database: Db = db,
  input: PersonnelFinanceFilter & { pageSize: number; offset: number },
) {
  const rows = await database
    .select({
      month: transactionMonth,
      personnelId: movement.customerId,
      personnelName: customer.name,
      currency: movement.currency,
      amount: sql<string>`cast(${movement.amount} as text)`,
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
  const byGroup = new Map<
    string,
    { month: number; personnelId: string | null; personnelName: string | null; currency: string; allocated: string }
  >()
  for (const row of rows) {
    const key = `${row.month}:${row.personnelId ?? ""}:${row.currency}`
    const group = byGroup.get(key) ?? {
      month: row.month,
      personnelId: row.personnelId,
      personnelName: row.personnelName,
      currency: row.currency,
      allocated: "0",
    }
    group.allocated = (BigInt(group.allocated) - BigInt(row.amount)).toString()
    byGroup.set(key, group)
  }
  const items = [...byGroup.values()].sort(
    (left, right) =>
      left.month - right.month ||
      (left.personnelName ?? "").localeCompare(right.personnelName ?? "") ||
      left.currency.localeCompare(right.currency),
  )
  return { items: items.slice(input.offset, input.offset + input.pageSize), totalCount: items.length }
}
