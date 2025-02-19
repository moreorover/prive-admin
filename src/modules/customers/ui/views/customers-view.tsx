"use client";

import {
  Grid,
  GridCol,
  Group,
  Paper,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { trpc } from "@/trpc/client";
import { Suspense, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { LoaderSkeleton } from "@/components/loader-skeleton";
import { CustomersTable } from "@/modules/customers/ui/components/customers-table";

export const CustomersView = () => {
  return (
    <Suspense fallback={<LoaderSkeleton />}>
      <ErrorBoundary fallback={<p>Error</p>}>
        <CustomersSuspense />
      </ErrorBoundary>
    </Suspense>
  );
};

function CustomersSuspense() {
  const [customers] = trpc.customers.getAll.useSuspenseQuery();

  const [searchTerm, setSearchTerm] = useState("");

  const filteredCustomers = customers.filter((customer) => {
    const searchLower = searchTerm.toLowerCase();

    return (
      customer.name.toLowerCase().includes(searchLower) ||
      customer.id.toLowerCase() === searchLower
    );
  });

  return (
    <Grid>
      <GridCol span={12}>
        <Paper withBorder p="md" radius="md" shadow="sm">
          <Group justify="space-between">
            <Title order={4}>Customers</Title>
            <Group>
              <TextInput
                placeholder="Search..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.currentTarget.value)}
              />
            </Group>
          </Group>
        </Paper>
      </GridCol>
      <GridCol span={12}>
        {filteredCustomers.length > 0 ? (
          <CustomersTable customers={filteredCustomers} />
        ) : (
          <Paper withBorder p="md" radius="md" shadow="sm">
            <Text c="gray">No customers found.</Text>
          </Paper>
        )}
      </GridCol>
    </Grid>
  );
}
