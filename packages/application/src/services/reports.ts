import { bankAccountMonthlyBreakdownRows } from "@prive-admin-tanstack/db"

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

export async function bankAccountMonthlyBreakdown(input: { year: number; legalEntityId?: string }) {
  const { accounts, rows } = await bankAccountMonthlyBreakdownRows(undefined, input)

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
}
