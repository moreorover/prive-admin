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
import useCounter from "@/hooks/useCounter";

export const TransactionsView = () => {
  const { count, increase, decrease, reset } = useCounter();
  return (
    <>
      <Group>
        <Button onClick={reset}>back</Button>
        <Button onClick={decrease}>-</Button>
        <Title>{count}</Title>
        <Button onClick={increase}>+</Button>
      </Group>
      <Suspense fallback={<LoaderSkeleton />}>
        <ErrorBoundary fallback={<p>Error</p>}>
          <TransactionsSuspense />
        </ErrorBoundary>
      </Suspense>
    </>
  );
};

function TransactionsSuspense() {
  const utils = trpc.useUtils();

  const [transactions] =
    trpc.transactions.getAllTransactionsWithAllocations.useSuspenseQuery();

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
    </Grid>
  );
}
