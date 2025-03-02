import { GetAllTransactions } from "@/modules/transactions/types";
import dayjs, { Dayjs } from "dayjs";

export type AggregatedResult = {
  date: string;
  total: number;
}[];

export function aggregateTransactions(
  startDate: string,
  endDate: string,
  transactions: GetAllTransactions,
): AggregatedResult {
  const start: Dayjs = dayjs(startDate);
  const end: Dayjs = dayjs(endDate);
  const result: Record<string, number> = {};

  // Initialize the result object with each date in the range
  for (
    let date = start;
    date.isBefore(end) || date.isSame(end, "day");
    date = date.add(1, "day")
  ) {
    result[date.format("YYYY-MM-DD")] = 0;
  }

  // Sum up transactions by date
  transactions.forEach(({ createdAt, amount }) => {
    const date = dayjs(createdAt).format("YYYY-MM-DD");
    if (result.hasOwnProperty(date)) {
      result[date] += amount;
    }
  });

  // Convert result object to an array and calculate cumulative totals
  let cumulativeTotal = 0;
  return Object.entries(result).map(([date, total]) => {
    cumulativeTotal += total;
    return { date, total: cumulativeTotal };
  });
}
