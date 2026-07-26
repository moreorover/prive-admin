import { describe, expect, it } from "vite-plus/test"

import {
  calculateMonthlyMetric,
  monthKeyFromDate,
  previousMonth,
  selectedMonthData,
  selectedYearInputs,
} from "./dashboard-monthly-stats"

describe("dashboard monthly stats helpers", () => {
  it("formats dates as stable URL month keys", () => {
    expect(monthKeyFromDate(new Date(2026, 0, 15))).toBe("2026-01")
    expect(monthKeyFromDate(new Date(2026, 10, 1))).toBe("2026-11")
  })

  it("calculates the previous month across a year boundary", () => {
    expect(previousMonth({ year: 2026, month: 1 })).toEqual({ year: 2025, month: 12 })
    expect(previousMonth({ year: 2026, month: 7 })).toEqual({ year: 2026, month: 6 })
  })

  it("requests the previous year only when January needs a December comparison", () => {
    expect(selectedYearInputs({ year: 2026, month: 1 })).toEqual({ currentYear: 2026, previousYear: 2025 })
    expect(selectedYearInputs({ year: 2026, month: 7 })).toEqual({ currentYear: 2026, previousYear: undefined })
  })

  it("selects current and previous buckets for the chosen month", () => {
    const currentYear = {
      months: [
        { month: 1, weight: 120, soldFor: 24000, profit: 9000, pricePerGram: 200 },
        { month: 2, weight: 80, soldFor: 20000, profit: 7000, pricePerGram: 250 },
      ],
      totals: { weight: 200, soldFor: 44000, profit: 16000, pricePerGramAvg: 220 },
    }

    expect(selectedMonthData(currentYear, undefined, { year: 2026, month: 2 })).toEqual({
      current: { month: 2, weight: 80, soldFor: 20000, profit: 7000, pricePerGram: 250 },
      previous: { month: 1, weight: 120, soldFor: 24000, profit: 9000, pricePerGram: 200 },
    })
  })

  it("uses the previous year bucket for January comparisons", () => {
    const currentYear = {
      months: [{ month: 1, weight: 50, soldFor: 10000, profit: 4000, pricePerGram: 200 }],
      totals: { weight: 50, soldFor: 10000, profit: 4000, pricePerGramAvg: 200 },
    }
    const previousYear = {
      months: [{ month: 12, weight: 70, soldFor: 14000, profit: 5000, pricePerGram: 200 }],
      totals: { weight: 70, soldFor: 14000, profit: 5000, pricePerGramAvg: 200 },
    }

    expect(selectedMonthData(currentYear, previousYear, { year: 2026, month: 1 })).toEqual({
      current: { month: 1, weight: 50, soldFor: 10000, profit: 4000, pricePerGram: 200 },
      previous: { month: 12, weight: 70, soldFor: 14000, profit: 5000, pricePerGram: 200 },
    })
  })

  it("calculates monthly metric deltas without dividing by zero", () => {
    expect(calculateMonthlyMetric(150, 100)).toEqual({
      current: 150,
      previous: 100,
      difference: 50,
      percentage: 50,
    })
    expect(calculateMonthlyMetric(25, 0)).toEqual({
      current: 25,
      previous: 0,
      difference: 25,
      percentage: 100,
    })
  })
})
