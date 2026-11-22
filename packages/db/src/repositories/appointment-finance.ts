import { and, eq, gte, inArray, isNotNull, lt, sql } from "drizzle-orm"

import { db, type Db } from "../client"
import { customer } from "../schema/customer"
import { transaction as movement, transactionMovementTypes } from "../schema/transaction"

export type FinancePeriod = { year: number; currency?: string }
export type PersonnelFinanceFilter = FinancePeriod & { month?: number; personnelId?: string }

const transactionMonth = sql<number>`cast(strftime('%m', ${movement.createdAt} / 1000, 'unixepoch') as integer)`
const classified = inArray(movement.movementType, transactionMovementTypes)
const safeChunkSize = 1024

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
  if (row.movementType === "personnel_allocation")
    totals.personnelAllocations = (BigInt(totals.personnelAllocations) - amount).toString()
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

function aggregateMonthlyRows(rows: Array<MovementRow & { month: number }>) {
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

function appointmentChunks(database: Db, appointmentId: string) {
  const numbered = database
    .select({
      currency: movement.currency,
      movementType: movement.movementType,
      amount: movement.amount,
      bucket:
        sql<number>`cast((row_number() over (partition by ${movement.currency}, ${movement.movementType} order by ${movement.id}) - 1) / ${safeChunkSize} as integer)`.as(
          "bucket",
        ),
    })
    .from(movement)
    .where(and(eq(movement.appointmentId, appointmentId), classified))
    .as("appointment_numbered")
  return database
    .select({
      currency: numbered.currency,
      movementType: numbered.movementType,
      amount: sql<string>`cast(sum(${numbered.amount}) as text)`,
    })
    .from(numbered)
    .groupBy(numbered.currency, numbered.movementType, sql`${numbered.bucket}`)
}

export async function appointmentFinanceRows(database: Db = db, appointmentId: string) {
  return aggregateRows(await appointmentChunks(database, appointmentId))
}

function monthlyChunks(database: Db, input: FinancePeriod) {
  const numbered = database
    .select({
      month: transactionMonth.as("month"),
      currency: movement.currency,
      movementType: movement.movementType,
      amount: movement.amount,
      bucket:
        sql<number>`cast((row_number() over (partition by ${transactionMonth}, ${movement.currency}, ${movement.movementType} order by ${movement.id}) - 1) / ${safeChunkSize} as integer)`.as(
          "bucket",
        ),
    })
    .from(movement)
    .where(and(periodFilter(input), classified))
    .as("monthly_numbered")
  return database
    .select({
      month: numbered.month,
      currency: numbered.currency,
      movementType: numbered.movementType,
      amount: sql<string>`cast(sum(${numbered.amount}) as text)`,
    })
    .from(numbered)
    .groupBy(sql`${numbered.month}`, numbered.currency, numbered.movementType, sql`${numbered.bucket}`)
}

export async function monthlyFinanceRows(database: Db = db, input: FinancePeriod) {
  return aggregateMonthlyRows(await monthlyChunks(database, input))
}

type PersonnelRow = {
  month: number
  personnelId: string | null
  personnelName: string | null
  currency: string
  amount: string
}

export function sortPersonnelAllocationRows<
  T extends { month: number; personnelName: string | null; personnelId: string | null; currency: string },
>(rows: T[]) {
  return [...rows].sort(
    (left, right) =>
      left.month - right.month ||
      (left.personnelName ?? "").localeCompare(right.personnelName ?? "") ||
      (left.personnelId ?? "").localeCompare(right.personnelId ?? "") ||
      left.currency.localeCompare(right.currency),
  )
}

function aggregatePersonnelRows(rows: PersonnelRow[], input: { pageSize: number; offset: number }) {
  const byGroup = new Map<string, Omit<PersonnelRow, "amount"> & { allocated: string }>()
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
  const items = sortPersonnelAllocationRows([...byGroup.values()])
  return { items: items.slice(input.offset, input.offset + input.pageSize), totalCount: items.length }
}

function personnelChunks(database: Db, input: PersonnelFinanceFilter) {
  const numbered = database
    .select({
      month: transactionMonth.as("month"),
      personnelId: movement.customerId,
      personnelName: customer.name,
      currency: movement.currency,
      amount: movement.amount,
      bucket:
        sql<number>`cast((row_number() over (partition by ${transactionMonth}, ${movement.customerId}, ${movement.currency} order by ${movement.id}) - 1) / ${safeChunkSize} as integer)`.as(
          "bucket",
        ),
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
    .as("personnel_numbered")
  return database
    .select({
      month: numbered.month,
      personnelId: numbered.personnelId,
      personnelName: numbered.personnelName,
      currency: numbered.currency,
      amount: sql<string>`cast(sum(${numbered.amount}) as text)`,
    })
    .from(numbered)
    .groupBy(
      sql`${numbered.month}`,
      numbered.personnelId,
      numbered.personnelName,
      numbered.currency,
      sql`${numbered.bucket}`,
    )
}

export async function personnelAllocationRows(
  database: Db = db,
  input: PersonnelFinanceFilter & { pageSize: number; offset: number },
) {
  return aggregatePersonnelRows(await personnelChunks(database, input), input)
}
