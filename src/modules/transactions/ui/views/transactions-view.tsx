"use client";

import {
  Divider,
  Flex,
  Grid,
  GridCol,
  Paper,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { trpc } from "@/trpc/client";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { LoaderSkeleton } from "@/components/loader-skeleton";
import TransactionsTable from "@/modules/transactions/ui/components/transactions-table";
import { LineChart } from "@mantine/charts";
import { aggregateTransactions } from "@/modules/transactions/hooks/chartUtils";
import useDateRange from "@/modules/ui/hooks/useDateRange";
import Surface from "@/modules/ui/components/surface";
import { FilterDateMenu } from "@/modules/ui/components/filter-date-menu";
import { useRouter } from "next/navigation";

interface Props {
  startDate: string;
  endDate: string;
}

export const TransactionsView = () => {
  const router = useRouter();
  const { start, end, range, rangeText, createQueryString } = useDateRange();

  return (
    <Stack>
      <Surface component={Paper} style={{ backgroundColor: "transparent" }}>
        <Flex
          justify="space-between"
          direction={{ base: "column", sm: "row" }}
          gap={{ base: "sm", sm: 4 }}
        >
          <Stack gap={4}>
            <Title order={3}>Transactions</Title>
          </Stack>
          <Flex align="center" gap="sm">
            <FilterDateMenu
              range={range}
              rangeInText={rangeText}
              onSelected={(range) =>
                router.push(
                  `/dashboard/transactions${createQueryString(range)}`,
                )
              }
            />
          </Flex>
        </Flex>
      </Surface>
      <Divider />
      <Grid gutter={{ base: 5, xs: "md", md: "lg" }}>
        <Suspense
          fallback={
            <GridCol>
              <LoaderSkeleton />
            </GridCol>
          }
        >
          <ErrorBoundary fallback={<p>Error</p>}>
            <TransactionsSuspense startDate={start} endDate={end} />
          </ErrorBoundary>
        </Suspense>
      </Grid>
    </Stack>
  );
};

function TransactionsSuspense({ startDate, endDate }: Props) {
  const utils = trpc.useUtils();

  const [transactions] =
    trpc.transactions.getTransactionsBetweenDates.useSuspenseQuery({
      startDate,
      endDate,
    });

  // const chartData = aggregateTransactions(startDate, endDate, transactions);
  const data = aggregateTransactions(startDate, endDate, transactions);

  return (
    <>
      <GridCol span={{ base: 12 }}>
        <Paper withBorder p="md" radius="md" shadow="sm">
          {transactions.length > 0 ? (
            <LineChart
              h={300}
              data={data}
              dataKey="date"
              unit="£"
              series={[
                { name: "completed", color: "blue" },
                { name: "pending", color: "gray", strokeDasharray: "5 5" }, // Dimmed color for pending
                { name: "total", color: "red" }, // Dimmed color for pending
              ]}
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
