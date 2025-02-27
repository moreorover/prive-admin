"use client";

import {
  Button,
  Grid,
  GridCol,
  Group,
  Paper,
  Text,
  Title,
} from "@mantine/core";
import { trpc } from "@/trpc/client";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { LoaderSkeleton } from "@/components/loader-skeleton";
import TransactionsTable from "@/modules/transactions/ui/components/transactions-table";
import useMonthOffset from "@/hooks/useMonthOffset";
import dayjs, { Dayjs } from "dayjs";
import { LineChart } from "@mantine/charts";
import { GetAllTransactionsWithAllocations } from "@/modules/transactions/types";

interface Props {
  startDate: string;
  endDate: string;
}

type AggregatedResult = {
  date: string;
  total: number;
}[];

function aggregateTransactions(
  startDate: string,
  endDate: string,
  transactions: GetAllTransactionsWithAllocations,
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

export const TransactionsView = () => {
  const {
    isCurrentMonth,
    startOfMonth,
    endOfMonth,
    addMonth,
    subtractMonth,
    resetMonth,
  } = useMonthOffset();

  return (
    <Grid>
      <GridCol span={12}>
        <Paper withBorder p="md" radius="md" shadow="sm">
          <Group justify="space-between">
            <Title order={4}>Transactions</Title>
            <Group>
              {!isCurrentMonth && (
                <Button onClick={resetMonth} variant="light" color="cyan">
                  Current Month
                </Button>
              )}
              <Button variant="light" onClick={subtractMonth}>
                Previous Month
              </Button>
              <Text>
                {dayjs(startOfMonth).format("MMM, YYYY")} -{" "}
                {dayjs(endOfMonth).format("MMM, YYYY")}
              </Text>
              <Button variant="light" onClick={addMonth}>
                Next Month
              </Button>
            </Group>
          </Group>
        </Paper>
      </GridCol>
      <Suspense fallback={<LoaderSkeleton />}>
        <ErrorBoundary fallback={<p>Error</p>}>
          <TransactionsSuspense startDate={startOfMonth} endDate={endOfMonth} />
        </ErrorBoundary>
      </Suspense>
    </Grid>
  );
};

function TransactionsSuspense({ startDate, endDate }: Props) {
  const utils = trpc.useUtils();

  const [transactions] =
    trpc.transactions.getTransactionsBetweenDates.useSuspenseQuery({
      startDate,
      endDate,
    });

  const ts = aggregateTransactions(startDate, endDate, transactions);

  return (
    <>
      <GridCol span={12}>
        <Paper withBorder p="md" radius="md" shadow="sm">
          <LineChart
            h={300}
            data={ts}
            dataKey="date"
            unit="£"
            series={[{ name: "total", color: "indigo.6" }]}
            curveType="natural"
          />
        </Paper>
      </GridCol>
      <GridCol span={12}>
        <Paper withBorder p="md" radius="md" shadow="sm">
          {transactions.length > 0 ? (
            <TransactionsTable
              transactions={transactions}
              onUpdateAction={() => {
                utils.transactions.getAllTransactionsWithAllocations.invalidate();
              }}
            />
          ) : (
            <Text c="gray">No transactions found.</Text>
          )}
        </Paper>
      </GridCol>
    </>
  );
}
