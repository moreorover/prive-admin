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
import { useSetAtom } from "jotai";
import {
  editCustomerDrawerAtom,
  newAppointmentDrawerAtom,
  newOrderDrawerAtom,
} from "@/lib/atoms";
import { OrdersTable } from "@/modules/orders/ui/components/orders-table";

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
  const utils = trpc.useUtils();
  const [customer] = trpc.customers.getOne.useSuspenseQuery({ id: customerId });
  const [appointments] =
    trpc.appointments.getAppointmentsByCustomerId.useSuspenseQuery({
      customerId,
    });
  const [orders] = trpc.orders.getOrdersByCustomerId.useSuspenseQuery({
    customerId,
  });
  const showUpdateCustomerDrawer = useSetAtom(editCustomerDrawerAtom);
  const showCreateOrderDrawer = useSetAtom(newOrderDrawerAtom);
  const showCreateAppointmentDrawer = useSetAtom(newAppointmentDrawerAtom);

  return (
    <Grid>
      <GridCol span={12}>
        <Paper withBorder p="md" radius="md" shadow="sm">
          <Group justify="space-between">
            <Title order={4}>{customer.name}</Title>
            <Group>
              <Button
                onClick={() => {
                  showUpdateCustomerDrawer({
                    isOpen: true,
                    customer,
                    onCreated: () => {
                      utils.customers.getOne.invalidate({ id: customerId });
                    },
                  });
                }}
              >
                Edit
              </Button>
            </Group>
          </Group>
        </Paper>
      </GridCol>
      <GridCol span={12}>
        <Paper withBorder p="md" radius="md" shadow="sm">
          <Group justify="space-between">
            <Title order={4}>Appointments</Title>
            <Group>
              <Button
                onClick={() => {
                  showCreateAppointmentDrawer({
                    isOpen: true,
                    clientId: customer.id,
                    onCreated: () => {
                      utils.appointments.getAppointmentsByCustomerId.invalidate(
                        { customerId },
                      );
                    },
                  });
                }}
              >
                New
              </Button>
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
        <Paper withBorder p="md" radius="md" shadow="sm">
          <Group justify="space-between">
            <Title order={4}>Orders</Title>
            <Group>
              <Button
                onClick={() => {
                  showCreateOrderDrawer({
                    isOpen: true,
                    customerId,
                    onCreated: () => {
                      utils.customers.getOne.invalidate({ id: customerId });
                    },
                  });
                }}
              >
                New
              </Button>
            </Group>
          </Group>
          {orders.length > 0 ? (
            <OrdersTable orders={orders} />
          ) : (
            <Text c="gray">No Orders found.</Text>
          )}
        </Paper>
      </GridCol>
    </Grid>
  );
}
