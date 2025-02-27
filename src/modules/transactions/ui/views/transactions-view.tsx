"use client";

import {
  Button,
  Center,
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
import { LineChart } from "@mantine/charts";
import { CsvUploadButton } from "@/modules/transactions/ui/components/csv-upload-button";
import { aggregateTransactions } from "@/modules/transactions/hooks/chartUtils";
import { DatePicker } from "@mantine/dates";
import useDateRangeMonth from "@/hooks/useDateRangeMonth";

interface Props {
  startDate: string;
  endDate: string;
}

export const TransactionsView = () => {
  const {
    startOfMonth,
    endOfMonth,
    pendingDates,
    setStartAndEnd,
    confirmDateSelection,
    isConfirmationPending,
  } = useDateRangeMonth();

  return (
    <Grid>
      <GridCol span={12}>
        <Paper withBorder p="md" radius="md" shadow="sm">
          <Group justify="space-between">
            <Title order={4}>Transactions</Title>
            <Group>
              <CsvUploadButton />
            </Group>
          </Group>
        </Paper>
      </GridCol>
      <GridCol span={3}>
        <Paper withBorder p="md" radius="md" shadow="sm">
          <Group justify="space-between">
            <Center>
              <DatePicker
                // size="xs"
                type="range"
                value={pendingDates}
                onChange={setStartAndEnd}
              />
            </Center>
            <Center>
              <Button
                onClick={confirmDateSelection}
                disabled={!isConfirmationPending()}
              >
                Apply
              </Button>
            </Center>
          </Group>
        </Paper>
      </GridCol>
      <Suspense
        fallback={
          <GridCol>
            <LoaderSkeleton />
          </GridCol>
        }
      >
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

  const chartData = aggregateTransactions(startDate, endDate, transactions);

  return (
    <>
      <GridCol span={9}>
        <Paper withBorder p="md" radius="md" shadow="sm">
          {transactions.length > 0 ? (
            <LineChart
              h={300}
              data={chartData}
              dataKey="date"
              unit="£"
              series={[{ name: "total", color: "indigo.6" }]}
              curveType="natural"
            />
          ) : (
            <Text c="gray">No transactions found.</Text>
          )}
        </Paper>
      </GridCol>
      <GridCol span={12}>
        <Paper withBorder p="md" radius="md" shadow="sm">
          {transactions.length > 0 ? (
            <TransactionsTable
              transactions={transactions}
              onUpdateAction={() => {
                utils.transactions.getTransactionsBetweenDates.invalidate({
                  startDate,
                  endDate,
                });
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
