import { db, whereActiveLegalEntity } from "@prive-admin-tanstack/db"
import { appointment } from "@prive-admin-tanstack/db/schema/appointment"
import { hairAssigned, hairOrder } from "@prive-admin-tanstack/db/schema/hair"
import { transaction } from "@prive-admin-tanstack/db/schema/transaction"
import { createServerFn } from "@tanstack/react-start"
import { and, eq, gte, isNotNull, isNull, lt, sql } from "drizzle-orm"
import { z } from "zod"

import { requireAuthMiddleware } from "@/middleware/auth"

const yearSchema = z.object({
  year: z.number().int().min(2000).max(3000),
  legalEntityId: z.string().optional(),
})

export type TransactionMonthlyByCurrency = {
  currency: string
  months: { month: number; total: number }[]
  total: number
}

export const getTransactionStatsForDate = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .inputValidator(yearSchema)
  .handler(async ({ data }): Promise<TransactionMonthlyByCurrency[]> => {
    const yearStart = `${data.year}-01-01`
    const yearEnd = `${data.year + 1}-01-01`

    const rows = await db
      .select({
        currency: transaction.currency,
        month: sql<number>`extract(month from ${transaction.completedDateBy})::int`,
        sum: sql<number>`coalesce(sum(${transaction.amount}), 0)::int`,
      })
      .from(transaction)
      .where(
        and(
          gte(transaction.completedDateBy, yearStart),
          lt(transaction.completedDateBy, yearEnd),
          eq(transaction.status, "COMPLETED"),
          isNotNull(transaction.appointmentId),
          data.legalEntityId ? whereActiveLegalEntity(transaction.legalEntityId, data.legalEntityId) : undefined,
        ),
      )
      .groupBy(transaction.currency, sql`extract(month from ${transaction.completedDateBy})`)

    return buildCurrencyBuckets(rows)
  })

export type HairMetricRow = { month: number; weight: number; soldFor: number; profit: number; pricePerGram: number }

export type HairMonthlyBreakdown = {
  months: HairMetricRow[]
  totals: { weight: number; soldFor: number; profit: number; pricePerGramAvg: number }
}

export const getHairAssignedStatsForDate = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .inputValidator(yearSchema)
  .handler(async ({ data }): Promise<HairMonthlyBreakdown> => {
    const { current } = yearlyRanges(data.year)
    const rows = await db
      .select({
        month: sql<number>`extract(month from ${appointment.startsAt})::int`,
        weight: sql<number>`coalesce(sum(${hairAssigned.weightInGrams}), 0)::int`,
        soldFor: sql<number>`coalesce(sum(${hairAssigned.soldFor}), 0)::int`,
        profit: sql<number>`coalesce(sum(${hairAssigned.profit}), 0)::int`,
        pricePerGram: sql<number>`coalesce(avg(${hairAssigned.pricePerGram}), 0)::int`,
      })
      .from(hairAssigned)
      .innerJoin(appointment, eq(hairAssigned.appointmentId, appointment.id))
      .innerJoin(hairOrder, eq(hairAssigned.hairOrderId, hairOrder.id))
      .where(
        and(
          gte(appointment.startsAt, current.start),
          lt(appointment.startsAt, current.end),
          data.legalEntityId ? eq(hairOrder.legalEntityId, data.legalEntityId) : undefined,
        ),
      )
      .groupBy(sql`extract(month from ${appointment.startsAt})`)

    return buildHairBuckets(rows)
  })

export const getHairAssignedThroughSaleStatsForDate = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .inputValidator(yearSchema)
  .handler(async ({ data }): Promise<HairMonthlyBreakdown> => {
    const { current } = yearlyRanges(data.year)
    const rows = await db
      .select({
        month: sql<number>`extract(month from ${hairAssigned.createdAt})::int`,
        weight: sql<number>`coalesce(sum(${hairAssigned.weightInGrams}), 0)::int`,
        soldFor: sql<number>`coalesce(sum(${hairAssigned.soldFor}), 0)::int`,
        profit: sql<number>`coalesce(sum(${hairAssigned.profit}), 0)::int`,
        pricePerGram: sql<number>`coalesce(avg(${hairAssigned.pricePerGram}), 0)::int`,
      })
      .from(hairAssigned)
      .innerJoin(hairOrder, eq(hairAssigned.hairOrderId, hairOrder.id))
      .where(
        and(
          isNull(hairAssigned.appointmentId),
          gte(hairAssigned.createdAt, current.start),
          lt(hairAssigned.createdAt, current.end),
          data.legalEntityId ? eq(hairOrder.legalEntityId, data.legalEntityId) : undefined,
        ),
      )
      .groupBy(sql`extract(month from ${hairAssigned.createdAt})`)

    return buildHairBuckets(rows)
  })

type Range = { start: Date; end: Date }

function yearlyRanges(year: number): { current: Range; previous: Range } {
  return {
    current: { start: new Date(Date.UTC(year, 0, 1)), end: new Date(Date.UTC(year + 1, 0, 1)) },
    previous: { start: new Date(Date.UTC(year - 1, 0, 1)), end: new Date(Date.UTC(year, 0, 1)) },
  }
}

function buildCurrencyBuckets(
  rows: { currency: string; month: number; sum: number }[],
): TransactionMonthlyByCurrency[] {
  const byCurrency = new Map<string, Map<number, number>>()
  for (const r of rows) {
    const m = byCurrency.get(r.currency) ?? new Map<number, number>()
    m.set(r.month, Number(r.sum))
    byCurrency.set(r.currency, m)
  }
  const result: TransactionMonthlyByCurrency[] = []
  for (const [currency, m] of byCurrency.entries()) {
    const months: { month: number; total: number }[] = []
    let total = 0
    for (let mo = 1; mo <= 12; mo++) {
      const v = m.get(mo) ?? 0
      months.push({ month: mo, total: v })
      total += v
    }
    result.push({ currency, months, total })
  }
  result.sort((a, b) => a.currency.localeCompare(b.currency))
  return result
}

function buildHairBuckets(
  rows: { month: number; weight: number; soldFor: number; profit: number; pricePerGram: number }[],
): HairMonthlyBreakdown {
  const byMonth = new Map<number, { weight: number; soldFor: number; profit: number; pricePerGram: number }>()
  for (const r of rows) {
    byMonth.set(r.month, {
      weight: Number(r.weight),
      soldFor: Number(r.soldFor),
      profit: Number(r.profit),
      pricePerGram: Number(r.pricePerGram),
    })
  }
  const months: HairMetricRow[] = []
  let weightSum = 0
  let soldForSum = 0
  let profitSum = 0
  let ppgWeightedNum = 0
  let ppgWeightedDen = 0
  for (let mo = 1; mo <= 12; mo++) {
    const b = byMonth.get(mo) ?? { weight: 0, soldFor: 0, profit: 0, pricePerGram: 0 }
    months.push({ month: mo, ...b })
    weightSum += b.weight
    soldForSum += b.soldFor
    profitSum += b.profit
    if (b.weight > 0) {
      ppgWeightedNum += b.pricePerGram * b.weight
      ppgWeightedDen += b.weight
    }
  }
  return {
    months,
    totals: {
      weight: weightSum,
      soldFor: soldForSum,
      profit: profitSum,
      pricePerGramAvg: ppgWeightedDen > 0 ? Math.round(ppgWeightedNum / ppgWeightedDen) : 0,
    },
  }
}
