import { GetAllTransactions } from "@/modules/transactions/types";
import dayjs, { Dayjs } from "dayjs";

export type AggregatedResult = {
  date: string;
  completed: number;
  pending: number;
}[];

export function aggregateTransactions(
  startDate: string,
  endDate: string,
  transactions: GetAllTransactions,
): AggregatedResult {
  const start: Dayjs = dayjs(startDate);
  const end: Dayjs = dayjs(endDate);
  const result: Record<string, { completed: number; pending: number }> = {};

  // Initialize the result object with each date in the range
  for (
    let date = start;
    date.isBefore(end) || date.isSame(end, "day");
    date = date.add(1, "day")
  ) {
    const dateStr = date.format("MMM D"); // Format as "Mar 22"
    result[dateStr] = { completed: 0, pending: 0 };
  }

  // Sum up transactions by status and date
  transactions.forEach(({ createdAt, amount, status }) => {
    const date = dayjs(createdAt).format("MMM D");
    if (result[date]) {
      if (status === "COMPLETED") {
        result[date].completed += amount;
      } else if (status === "PENDING") {
        result[date].pending += amount;
      }
    }
  });

  // Convert to array and calculate cumulative totals
  let cumulativeCompleted = 0;
  let cumulativePending = 0;

  return Object.entries(result).map(([date, totals]) => {
    cumulativeCompleted += totals.completed;
    cumulativePending += totals.pending;

    return {
      date,
      completed: cumulativeCompleted,
      pending: cumulativePending,
    };
  });
}
