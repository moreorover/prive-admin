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
import dayjs from "dayjs";
import { AppointmentTransactionMenu } from "@/modules/appointments/ui/components/appointment-transaction-menu";
import { AppointmentPersonnelPicker } from "@/modules/appointments/ui/components/appointment-personnel-picker";
import PersonnelTable from "@/components/dashboard/appointments/PersonnelTable";
import TransactionsTable from "@/components/dashboard/transactions/TransactionsTable";

interface Props {
  appointmentId: string;
}
export const AppointmentView = ({ appointmentId }: Props) => {
  return (
    <Suspense fallback={<LoaderSkeleton />}>
      <ErrorBoundary fallback={<p>Error</p>}>
        <AppointmentSuspense appointmentId={appointmentId} />
      </ErrorBoundary>
    </Suspense>
  );
};

function AppointmentSuspense({ appointmentId }: Props) {
  const [appointment] = trpc.appointments.getOne.useSuspenseQuery({
    id: appointmentId,
  });

  return (
    <Grid>
      <GridCol span={12}>
        <Paper withBorder p="md" radius="md" shadow="sm">
          <Group justify="space-between">
            <Title order={4}>{appointment.name}</Title>
            <Group>
              <Button disabled>Edit</Button>
            </Group>
          </Group>
        </Paper>
      </GridCol>
      <GridCol span={12}>
        <Paper withBorder p="md" radius="md" shadow="sm">
          <Title order={4}>Appointment Details</Title>
          <Text size="sm" mt="xs">
            <strong>Notes:</strong> {appointment.notes || "No notes provided"}
          </Text>
          <Text size="sm" mt="xs">
            <strong>Start Time:</strong>{" "}
            {dayjs(appointment.startsAt).format("DD MMM YYYY HH:mm")}
          </Text>
        </Paper>
      </GridCol>
      <GridCol span={12}>
        <Grid>
          {/* Client Card */}
          <GridCol span={{ sm: 12, md: 3, lg: 3 }}>
            <Paper withBorder p="md" radius="md" shadow="sm">
              <Group justify="space-between" gap="sm">
                <Title order={4}>Client</Title>
                <AppointmentTransactionMenu
                  appointmentId={appointmentId}
                  customerId={appointment.client.id}
                />
              </Group>
              <Text size="sm" mt="xs">
                <strong>Name:</strong> {appointment.client.name}
              </Text>
            </Paper>
          </GridCol>

          {/* Personnel Involved */}
          <GridCol span={{ sm: 12, md: 9, lg: 9 }}>
            <Paper withBorder p="md" radius="md" shadow="sm">
              <Group justify="space-between" gap="sm">
                <Title order={4}>Personnel Involved</Title>
                <AppointmentPersonnelPicker appointmentId={appointmentId} />
              </Group>
              <PersonnelTable appointmentId={appointmentId} />
            </Paper>
          </GridCol>
        </Grid>
      </GridCol>

      {/* Transactions */}
      <GridCol span={12}>
        <Paper withBorder p="md" radius="md" shadow="sm">
          <Group justify="space-between" gap="sm">
            <Title order={4}>Transactions</Title>
          </Group>
          <TransactionsTable appointmentId={appointmentId} />
        </Paper>
      </GridCol>
    </Grid>
  );
}
