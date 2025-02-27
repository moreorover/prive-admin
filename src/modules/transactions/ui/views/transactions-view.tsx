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
import { CsvUploadButton } from "@/modules/transactions/ui/components/csv-upload-button";
import useMonthOffset from "@/hooks/useMonthOffset";
import dayjs from "dayjs";

interface Props {
  startDate: string;
  endDate: string;
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
      <GridCol span={12}>
        <Suspense fallback={<LoaderSkeleton />}>
          <ErrorBoundary fallback={<p>Error</p>}>
            <TransactionsSuspense
              startDate={startOfMonth}
              endDate={endOfMonth}
            />
          </ErrorBoundary>
        </Suspense>
      </GridCol>
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

  return (
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
  );
}
