export type DashboardMonth = {
  year: number
  month: number
}

export type HairMonthBucket = {
  month: number
  weight: number
  soldFor: number
  profit: number
  pricePerGram: number
}

export type HairMonthlyBreakdown = {
  months: HairMonthBucket[]
  totals: {
    weight: number
    soldFor: number
    profit: number
    pricePerGramAvg: number
  }
}

export type MonthlyMetric = {
  current: number
  previous: number
  difference: number
  percentage: number
}

const EMPTY_HAIR_MONTH_BUCKET: HairMonthBucket = {
  month: 0,
  weight: 0,
  soldFor: 0,
  profit: 0,
  pricePerGram: 0,
}

export function monthKeyFromDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  return `${year}-${month}`
}

export function dateFromMonthKey(monthKey: string): Date {
  const [year, month] = monthKey.split("-").map(Number)
  return new Date(year, month - 1, 1)
}

export function parseMonthKey(monthKey: string): DashboardMonth {
  const [year, month] = monthKey.split("-").map(Number)
  return { year, month }
}

export function previousMonth(selected: DashboardMonth): DashboardMonth {
  if (selected.month === 1) return { year: selected.year - 1, month: 12 }
  return { year: selected.year, month: selected.month - 1 }
}

export function selectedYearInputs(selected: DashboardMonth): { currentYear: number; previousYear?: number } {
  return {
    currentYear: selected.year,
    previousYear: selected.month === 1 ? selected.year - 1 : undefined,
  }
}

export function selectedMonthData(
  currentYearData: HairMonthlyBreakdown | undefined,
  previousYearData: HairMonthlyBreakdown | undefined,
  selected: DashboardMonth,
): { current: HairMonthBucket; previous: HairMonthBucket } {
  const prior = previousMonth(selected)
  const previousSource = prior.year === selected.year ? currentYearData : previousYearData

  return {
    current: currentYearData?.months.find((month) => month.month === selected.month) ?? {
      ...EMPTY_HAIR_MONTH_BUCKET,
      month: selected.month,
    },
    previous: previousSource?.months.find((month) => month.month === prior.month) ?? {
      ...EMPTY_HAIR_MONTH_BUCKET,
      month: prior.month,
    },
  }
}

export function calculateMonthlyMetric(current: number, previous: number): MonthlyMetric {
  const difference = current - previous
  const percentage = previous !== 0 ? (difference / Math.abs(previous)) * 100 : current > 0 ? 100 : 0

  return {
    current,
    previous,
    difference,
    percentage: Math.round(percentage * 100) / 100,
  }
}
