import { db } from "@prive-admin-tanstack/db"
import { whereActiveLegalEntity } from "@prive-admin-tanstack/db"
import { appointment } from "@prive-admin-tanstack/db/schema/appointment"
import { hairAssigned } from "@prive-admin-tanstack/db/schema/hair"
import { hairOrder } from "@prive-admin-tanstack/db/schema/hair"
import { transaction } from "@prive-admin-tanstack/db/schema/transaction"
import { createServerFn } from "@tanstack/react-start"
import dayjs from "dayjs"
import { and, eq, gte, isNotNull, isNull, lt } from "drizzle-orm"
import { z } from "zod"

import { CURRENCIES, type Currency, currencySymbol } from "@/lib/currency"
import { requireAuthMiddleware } from "@/middleware/auth"
import { readActiveLegalEntityId } from "@/server/active-legal-entity.server"

type Range = { start: Date; end: Date }

function monthlyRanges(dateInput: string): { current: Range; previous: Range } {
  const start = dayjs(dateInput).startOf("month")
  const nextMonthStart = start.add(1, "month")
  const previousStart = start.subtract(1, "month")
  return {
    current: { start: start.toDate(), end: nextMonthStart.toDate() },
    previous: { start: previousStart.toDate(), end: start.toDate() },
  }
}

function arrayStats(arr: number[]) {
  const count = arr.length
  const sum = arr.reduce((a, b) => a + b, 0)
  const average = count > 0 ? sum / count : 0
  return { count, sum, average: +average.toFixed(2) }
}

function pctChange(current: number, previous: number) {
  const difference = current - previous
  const percentage = previous !== 0 ? (difference / Math.abs(previous)) * 100 : current > 0 ? 100 : 0
  return { current, previous, difference, percentage: +percentage.toFixed(2) }
}

function calcAll(currentArr: number[], previousArr: number[]) {
  const c = arrayStats(currentArr)
  const p = arrayStats(previousArr)
  return {
    count: pctChange(c.count, p.count),
    total: pctChange(c.sum, p.sum),
    average: pctChange(c.average, p.average),
  }
}

export type StatValue = {
  current: string | number
  previous: string | number
  difference: string | number
  percentage: number
}
export type StatCategory = {
  total: StatValue
  average: StatValue
  count: StatValue
}

const fmtCents = (cents: number) => `$${(cents / 100).toFixed(2)}`

function categoryFromCents(raw: ReturnType<typeof calcAll>): StatCategory {
  return {
    total: {
      current: fmtCents(raw.total.current),
      previous: fmtCents(raw.total.previous),
      difference: fmtCents(raw.total.difference),
      percentage: raw.total.percentage,
    },
    average: {
      current: fmtCents(raw.average.current),
      previous: fmtCents(raw.average.previous),
      difference: fmtCents(raw.average.difference),
      percentage: raw.average.percentage,
    },
    count: {
      current: raw.count.current,
      previous: raw.count.previous,
      difference: raw.count.difference,
      percentage: raw.count.percentage,
    },
  }
}

function categoryFromMinor(raw: ReturnType<typeof calcAll>, currency: Currency): StatCategory {
  const fmt = (minor: number) => `${currencySymbol(currency)}${(minor / 100).toFixed(2)}`
  return {
    total: {
      current: fmt(Number(raw.total.current)),
      previous: fmt(Number(raw.total.previous)),
      difference: fmt(Number(raw.total.difference)),
      percentage: raw.total.percentage,
    },
    average: {
      current: fmt(Number(raw.average.current)),
      previous: fmt(Number(raw.average.previous)),
      difference: fmt(Number(raw.average.difference)),
      percentage: raw.average.percentage,
    },
    count: {
      current: raw.count.current,
      previous: raw.count.previous,
      difference: raw.count.difference,
      percentage: raw.count.percentage,
    },
  }
}

function categoryFromGrams(raw: ReturnType<typeof calcAll>): StatCategory {
  return {
    total: {
      current: `${raw.total.current}g`,
      previous: `${raw.total.previous}g`,
      difference: `${raw.total.difference}g`,
      percentage: raw.total.percentage,
    },
    average: {
      current: `${raw.average.current.toFixed(1)}g`,
      previous: `${raw.average.previous.toFixed(1)}g`,
      difference: `${raw.average.difference.toFixed(1)}g`,
      percentage: raw.average.percentage,
    },
    count: {
      current: raw.count.current,
      previous: raw.count.previous,
      difference: raw.count.difference,
      percentage: raw.count.percentage,
    },
  }
}

const toDateString = (d: Date) => d.toISOString().slice(0, 10)

export const getTransactionStatsForDate = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .inputValidator(z.object({ date: z.string() }))
  .handler(async ({ context, data }) => {
    const activeId = await readActiveLegalEntityId(context.session.user.id)
    const { current, previous } = monthlyRanges(data.date)
    const fetch = async (range: Range) =>
      db
        .select({ amount: transaction.amount, currency: transaction.currency })
        .from(transaction)
        .where(
          and(
            gte(transaction.completedDateBy, toDateString(range.start)),
            lt(transaction.completedDateBy, toDateString(range.end)),
            eq(transaction.status, "COMPLETED"),
            isNotNull(transaction.appointmentId),
            whereActiveLegalEntity(transaction.legalEntityId, activeId),
          ),
        )
    const [cur, prev] = await Promise.all([fetch(current), fetch(previous)])
    const result = {} as Record<Currency, StatCategory>
    for (const c of CURRENCIES) {
      const curAmounts = cur.filter((t) => t.currency === c).map((t) => t.amount)
      const prevAmounts = prev.filter((t) => t.currency === c).map((t) => t.amount)
      result[c] = categoryFromMinor(calcAll(curAmounts, prevAmounts), c)
    }
    return result
  })

export const getHairAssignedStatsForDate = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .inputValidator(z.object({ date: z.string() }))
  .handler(async ({ context, data }) => {
    const activeId = await readActiveLegalEntityId(context.session.user.id)
    const { current, previous } = monthlyRanges(data.date)
    const fetch = async (range: Range) =>
      db
        .select({
          weightInGrams: hairAssigned.weightInGrams,
          soldFor: hairAssigned.soldFor,
          profit: hairAssigned.profit,
          pricePerGram: hairAssigned.pricePerGram,
        })
        .from(hairAssigned)
        .innerJoin(appointment, eq(hairAssigned.appointmentId, appointment.id))
        .where(
          and(
            gte(appointment.startsAt, range.start),
            lt(appointment.startsAt, range.end),
            whereActiveLegalEntity(appointment.legalEntityId, activeId),
          ),
        )
    const [cur, prev] = await Promise.all([fetch(current), fetch(previous)])
    return {
      weightInGrams: categoryFromGrams(
        calcAll(
          cur.map((h) => h.weightInGrams),
          prev.map((h) => h.weightInGrams),
        ),
      ),
      soldFor: categoryFromCents(
        calcAll(
          cur.map((h) => h.soldFor),
          prev.map((h) => h.soldFor),
        ),
      ),
      profit: categoryFromCents(
        calcAll(
          cur.map((h) => h.profit),
          prev.map((h) => h.profit),
        ),
      ),
      pricePerGram: categoryFromCents(
        calcAll(
          cur.map((h) => h.pricePerGram),
          prev.map((h) => h.pricePerGram),
        ),
      ),
    }
  })

export const getHairAssignedThroughSaleStatsForDate = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .inputValidator(z.object({ date: z.string() }))
  .handler(async ({ context, data }) => {
    const activeId = await readActiveLegalEntityId(context.session.user.id)
    const { current, previous } = monthlyRanges(data.date)
    const fetch = async (range: Range) =>
      db
        .select({
          weightInGrams: hairAssigned.weightInGrams,
          soldFor: hairAssigned.soldFor,
          profit: hairAssigned.profit,
          pricePerGram: hairAssigned.pricePerGram,
        })
        .from(hairAssigned)
        .innerJoin(hairOrder, eq(hairAssigned.hairOrderId, hairOrder.id))
        .where(
          and(
            isNull(hairAssigned.appointmentId),
            gte(hairAssigned.createdAt, range.start),
            lt(hairAssigned.createdAt, range.end),
            whereActiveLegalEntity(hairOrder.legalEntityId, activeId),
          ),
        )
    const [cur, prev] = await Promise.all([fetch(current), fetch(previous)])
    return {
      weightInGrams: categoryFromGrams(
        calcAll(
          cur.map((h) => h.weightInGrams),
          prev.map((h) => h.weightInGrams),
        ),
      ),
      soldFor: categoryFromCents(
        calcAll(
          cur.map((h) => h.soldFor),
          prev.map((h) => h.soldFor),
        ),
      ),
      profit: categoryFromCents(
        calcAll(
          cur.map((h) => h.profit),
          prev.map((h) => h.profit),
        ),
      ),
      pricePerGram: categoryFromCents(
        calcAll(
          cur.map((h) => h.pricePerGram),
          prev.map((h) => h.pricePerGram),
        ),
      ),
    }
  })
