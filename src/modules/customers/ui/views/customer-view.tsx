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
import { AppointmentsTable } from "@/modules/customers/ui/components/appointments-table";

interface Props {
  customerId: string;
}

export const CustomerView = ({ customerId }: Props) => {
  return (
    <Suspense fallback={<LoaderSkeleton />}>
      <ErrorBoundary fallback={<p>Error</p>}>
        <CustomerSuspense customerId={customerId} />
      </ErrorBoundary>
    </Suspense>
  );
};

function CustomerSuspense({ customerId }: Props) {
  const [customer] = trpc.customers.getOne.useSuspenseQuery({ id: customerId });
  const [appointments] =
    trpc.appointments.getAppointmentsByCustomerId.useSuspenseQuery({
      customerId,
    });
  const [orders] = [[]];

  return (
    <Grid>
      <GridCol span={12}>
        <Paper withBorder p="md" radius="md" shadow="sm">
          <Group justify="space-between">
            <Title order={4}>{customer.name}</Title>
            <Group>
              <Button disabled>Edit</Button>
            </Group>
          </Group>
        </Paper>
      </GridCol>
      <GridCol span={12}>
        <Paper withBorder p="md" radius="md" shadow="sm">
          <Group justify="space-between">
            <Title order={4}>Appointments</Title>
            <Group>
              <Button disabled>New</Button>
            </Group>
          </Group>
          {appointments.length > 0 ? (
            <>
              <AppointmentsTable appointments={appointments} />
            </>
          ) : (
            <Text c="gray">No Appointments found.</Text>
          )}
        </Paper>
      </GridCol>
      <GridCol span={12}>
        {orders.length > 0 ? (
          <Paper withBorder p="md" radius="md" shadow="sm">
            <Text c="gray">Orders Table here to be...</Text>
          </Paper>
        ) : (
          <Paper withBorder p="md" radius="md" shadow="sm">
            <Text c="gray">No Orders found.</Text>
          </Paper>
        )}
      </GridCol>
    </Grid>
  );
}
