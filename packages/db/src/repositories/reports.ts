import { and, eq, gte, inArray, lt, sql } from "drizzle-orm"

import { db, type Db } from "../index"
import { bankAccount } from "../schema/bank-account"
import { bankStatementEntry } from "../schema/bank-statement-entry"

export async function bankAccountMonthlyBreakdownRows(
  database: Db = db,
  input: { year: number; legalEntityId?: string },
) {
  const yearStart = `${input.year}-01-01`
  const yearEnd = `${input.year + 1}-01-01`

  const accounts = await database.query.bankAccount.findMany({
    where: input.legalEntityId ? eq(bankAccount.legalEntityId, input.legalEntityId) : undefined,
    with: { legalEntity: true },
    orderBy: (a, { asc }) => [asc(a.displayName)],
  })

  const accountIds = accounts.map((a) => a.id)
  if (accountIds.length === 0) return { accounts, rows: [] }

  const rows = await database
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

  return { accounts, rows }
}
