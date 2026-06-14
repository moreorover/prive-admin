import { db } from "@prive-admin-tanstack/db"
import { bankAccount } from "@prive-admin-tanstack/db/schema/bank-account"
import { bankStatementEntry } from "@prive-admin-tanstack/db/schema/bank-statement-entry"
import { createServerFn } from "@tanstack/react-start"
import { and, eq, gte, inArray, lt, sql } from "drizzle-orm"
import { z } from "zod"

import { requireAuthMiddleware } from "@/middleware/auth"

const yearSchema = z.object({
  year: z.number().int().min(2000).max(3000),
  legalEntityId: z.string().optional(),
})

export type MonthlyBucket = {
  month: number // 1-12
  in: number // minor units, sum of credits
  out: number // minor units, sum of debits
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

export const getBankAccountMonthlyBreakdown = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .inputValidator(yearSchema)
  .handler(async ({ data }): Promise<BankAccountMonthlyBreakdown[]> => {
    const yearStart = `${data.year}-01-01`
    const yearEnd = `${data.year + 1}-01-01`

    // Pull all entries within the year + per-account metadata.
    const accounts = await db.query.bankAccount.findMany({
      where: data.legalEntityId ? eq(bankAccount.legalEntityId, data.legalEntityId) : undefined,
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

    return accounts.map((a) => {
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
  })
