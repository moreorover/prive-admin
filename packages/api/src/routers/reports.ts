import { db } from "@prive-admin-tanstack/db"
import { bankAccount } from "@prive-admin-tanstack/db/schema/bank-account"
import { bankStatementEntry } from "@prive-admin-tanstack/db/schema/bank-statement-entry"
import { and, eq, gte, inArray, lt, sql } from "drizzle-orm"
import { z } from "zod"

import { protectedProcedure, router } from "../index"

const yearSchema = z.object({
  year: z.number().int().min(2000).max(3000),
  legalEntityId: z.string().optional(),
})

export type MonthlyBucket = {
  month: number
  in: number
  out: number
}

export type BankAccountMonthlyBreakdown = {
  bankAccountId: string
  displayName: string
  iban: string
  currency: string
  legalEntityName: string
  months: MonthlyBucket[]
  totalIn: number
  totalOut: number
}

export const reportsRouter = router({
  bankAccountMonthlyBreakdown: protectedProcedure.input(yearSchema).query(async ({ input }) => {
    const yearStart = `${input.year}-01-01`
    const yearEnd = `${input.year + 1}-01-01`

    const accounts = await db.query.bankAccount.findMany({
      where: input.legalEntityId ? eq(bankAccount.legalEntityId, input.legalEntityId) : undefined,
      with: { legalEntity: true },
      orderBy: (a, { asc }) => [asc(a.displayName)],
    })

    const accountIds = accounts.map((a) => a.id)
    if (accountIds.length === 0) return []

    const rows = await db
      .select({
        bankAccountId: bankStatementEntry.bankAccountId,
        month: sql<number>`extract(month from ${bankStatementEntry.date})::int`,
        direction: bankStatementEntry.direction,
        sum: sql<number>`coalesce(sum(${bankStatementEntry.amount}), 0)::int`,
      })
      .from(bankStatementEntry)
      .where(
        and(
          gte(bankStatementEntry.date, yearStart),
          lt(bankStatementEntry.date, yearEnd),
          inArray(bankStatementEntry.bankAccountId, accountIds),
        ),
      )
      .groupBy(
        bankStatementEntry.bankAccountId,
        sql`extract(month from ${bankStatementEntry.date})`,
        bankStatementEntry.direction,
      )

    const byAccount = new Map<string, Map<number, MonthlyBucket>>()
    for (const r of rows) {
      const m = byAccount.get(r.bankAccountId) ?? new Map<number, MonthlyBucket>()
      const bucket = m.get(r.month) ?? { month: r.month, in: 0, out: 0 }
      if (r.direction === "C") bucket.in += Number(r.sum)
      else if (r.direction === "D") bucket.out += Number(r.sum)
      m.set(r.month, bucket)
      byAccount.set(r.bankAccountId, m)
    }

    return accounts.map((a): BankAccountMonthlyBreakdown => {
      const buckets = byAccount.get(a.id) ?? new Map<number, MonthlyBucket>()
      const months: MonthlyBucket[] = []
      let totalIn = 0
      let totalOut = 0
      for (let mo = 1; mo <= 12; mo++) {
        const b = buckets.get(mo) ?? { month: mo, in: 0, out: 0 }
        months.push(b)
        totalIn += b.in
        totalOut += b.out
      }
      return {
        bankAccountId: a.id,
        displayName: a.displayName,
        iban: a.iban,
        currency: a.currency,
        legalEntityName: a.legalEntity?.name ?? "",
        months,
        totalIn,
        totalOut,
      }
    })
  }),
})
