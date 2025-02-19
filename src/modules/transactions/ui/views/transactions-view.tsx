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
import { MonzoUpload } from "@/components/dashboard/transactions/MonzoUpload";
import { PayPalUpload } from "@/components/dashboard/transactions/PayPalUpload";
import TransactionsTable from "@/modules/transactions/ui/components/transactions-table";
import { useSetAtom } from "jotai/index";
import { newTransactionDrawerAtom } from "@/lib/atoms";

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
  const [transactions] = trpc.transactions.getAll.useSuspenseQuery();

  const showNewTransactionDrawer = useSetAtom(newTransactionDrawerAtom);

  return (
    <Grid>
      <GridCol span={12}>
        <Paper withBorder p="md" radius="md" shadow="sm">
          <Group justify="space-between">
            <Title order={4}>Transactions</Title>
            <Group>
              <MonzoUpload />
              <PayPalUpload />
              <Button
                onClick={() => {
                  showNewTransactionDrawer({
                    isOpen: true,
                    onCreated: () => {
                      utils.transactions.getAll.invalidate();
                    },
                  });
                }}
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
            <TransactionsTable transactions={transactions} />
          ) : (
            <Text c="gray">No transactions found.</Text>
          )}
        </Paper>
      </GridCol>
    </Grid>
  );
}
