import {
  hairAssignedThroughSaleMonthlyRows,
  hairAssignedMonthlyRows,
  transactionMonthlyRows,
} from "@prive-admin-tanstack/db"

export type TransactionMonthlyByCurrency = {
  currency: string
  months: { month: number; total: number }[]
  total: number
}

type HairMetricRow = { month: number; weight: number; soldFor: number; profit: number; pricePerGram: number }

export type HairMonthlyBreakdown = {
  months: HairMetricRow[]
  totals: { weight: number; soldFor: number; profit: number; pricePerGramAvg: number }
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

function buildHairBuckets(rows: HairMetricRow[]): HairMonthlyBreakdown {
  const byMonth = new Map<number, HairMetricRow>()
  for (const r of rows) {
    byMonth.set(r.month, { ...r })
  }
  const months: HairMetricRow[] = []
  let weightSum = 0
  let soldForSum = 0
  let profitSum = 0
  let ppgWeightedNum = 0
  let ppgWeightedDen = 0
  for (let mo = 1; mo <= 12; mo++) {
    const b = byMonth.get(mo) ?? { month: mo, weight: 0, soldFor: 0, profit: 0, pricePerGram: 0 }
    months.push(b)
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

export async function transactionStats(input: { year: number; legalEntityId?: string }) {
  return buildCurrencyBuckets(await transactionMonthlyRows(undefined, input))
}

export async function hairAssignedStats(input: { year: number }) {
  return buildHairBuckets(await hairAssignedMonthlyRows(undefined, input))
}

export async function hairAssignedThroughSaleStats(input: { year: number }) {
  return buildHairBuckets(await hairAssignedThroughSaleMonthlyRows(undefined, input))
}
