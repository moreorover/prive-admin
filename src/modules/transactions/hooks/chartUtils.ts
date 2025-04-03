import { GetAllTransactions } from "@/modules/transactions/types";
import dayjs, { Dayjs } from "dayjs";

export type AggregatedResult = {
  date: string;
  completed: number;
  pending: number; // This will actually show completed + pending
}[];

export function aggregateTransactions(
  startDate: string,
  endDate: string,
  transactions: GetAllTransactions,
): AggregatedResult {
  const start: Dayjs = dayjs(startDate);
  const end: Dayjs = dayjs(endDate);
  const dailyTotals: Record<string, { completed: number; pending: number }> =
    {};

  // Initialize with all dates in range
  for (
    let date = start;
    date.isBefore(end) || date.isSame(end, "day");
    date = date.add(1, "day")
  ) {
    const dateStr = date.format("MMM D");
    dailyTotals[dateStr] = { completed: 0, pending: 0 };
  }

  // Calculate daily totals
  transactions.forEach(({ completedDateBy, amount, status }) => {
    const date = dayjs(completedDateBy).format("MMM D");
    if (dailyTotals[date]) {
      if (status === "COMPLETED") {
        dailyTotals[date].completed += amount;
      } else if (status === "PENDING") {
        dailyTotals[date].pending += amount;
      }
    }
  });

  // Calculate cumulative totals
  let cumulativeCompleted = 0;
  let cumulativePendingTotal = 0; // This will track completed + pending

  return Object.entries(dailyTotals).map(([date, totals]) => {
    cumulativeCompleted += totals.completed;
    cumulativePendingTotal += totals.completed + totals.pending;

    return {
      date,
      completed: cumulativeCompleted,
      pending: cumulativePendingTotal, // This is the running total of ALL transactions
    };
  });
}
