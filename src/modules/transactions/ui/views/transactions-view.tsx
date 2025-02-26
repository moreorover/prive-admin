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
import { Suspense, useCallback } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { LoaderSkeleton } from "@/components/loader-skeleton";
import TransactionsTable from "@/modules/transactions/ui/components/transactions-table";
import { useSetAtom } from "jotai/index";
import { newTransactionDrawerAtom } from "@/lib/atoms";
import { MonzoUpload } from "@/modules/transactions/ui/components/monzo-upload";
import { PayPalUpload } from "@/modules/transactions/ui/components/paypal-upload";

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
  const utils = trpc.useUtils();
  const showNewTransactionDrawer = useSetAtom(newTransactionDrawerAtom);

  // Memoized function to avoid unnecessary re-renders
  const handleNewTransaction = useCallback(() => {
    showNewTransactionDrawer({
      isOpen: true,
      onCreated: () => {
        utils.transactions.getAll.invalidate();
      },
    });
  }, [showNewTransactionDrawer, utils.transactions.getAll]);

  const [transactions] =
    trpc.transactions.getAllTransactionsWithAllocations.useSuspenseQuery();

  return (
    <Grid>
      <GridCol span={12}>
        <Paper withBorder p="md" radius="md" shadow="sm">
          <Group justify="space-between">
            <Title order={4}>Transactions</Title>
            <Group>
              {/*
              TODO: make sure that createdAt transaction field is read from CSV provided
              */}
              <MonzoUpload />
              <PayPalUpload />
              <Button
                className="w-full lg:w-auto"
                onClick={handleNewTransaction}
              >
                New
              </Button>
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
