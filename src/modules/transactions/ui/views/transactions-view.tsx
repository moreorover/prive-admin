"use client";

import { Grid, GridCol, Group, Paper, Text, Title } from "@mantine/core";
import { trpc } from "@/trpc/client";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { LoaderSkeleton } from "@/components/loader-skeleton";
import { MonzoUpload } from "@/components/dashboard/transactions/MonzoUpload";
import { PayPalUpload } from "@/components/dashboard/transactions/PayPalUpload";
import TransactionsTable from "@/modules/transactions/ui/components/transactions-table";

export const TransactionsView = () => {
  return (
    <Suspense fallback={<LoaderSkeleton />}>
      <ErrorBoundary fallback={<p>Error</p>}>
        <TransactionsSuspense />
      </ErrorBoundary>
    </Suspense>
  );
};

function TransactionsSuspense() {
  const [transactions] = trpc.transactions.getAll.useSuspenseQuery();

  return (
    <Grid>
      <GridCol span={12}>
        <Paper withBorder p="md" radius="md" shadow="sm">
          <Group justify="space-between">
            <Title order={4}>Transactions</Title>
            <Group>
              <MonzoUpload />
              <PayPalUpload />
            </Group>
          </Group>
        </Paper>
      </GridCol>
      <GridCol span={12}>
        <Paper withBorder p="md" radius="md" shadow="sm">
          {transactions.length > 0 ? (
            <TransactionsTable transactions={transactions} />
          ) : (
            <Text c="gray">No transactions found.</Text>
          )}
        </Paper>
      </GridCol>
    </Grid>
  );
}
