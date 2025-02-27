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
import PersonnelTable from "@/modules/appointments/ui/components/personnel-table";
import TransactionsTable from "@/modules/appointments/ui/components/transactions-table";
import { PersonnelPickerModal } from "@/modules/appointments/ui/components/personnel-picker-modal";
import { editAppointmentDrawerAtom } from "@/lib/atoms";
import { useSetAtom } from "jotai";

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

  const [personnel] =
    trpc.customers.getPersonnelByAppointmentId.useSuspenseQuery({
      appointmentId,
    });

  const [transactionAllocations] =
    trpc.transactionAllocations.getByAppointmentAndOrderId.useSuspenseQuery({
      appointmentId,
      includeCustomer: true,
    });

  const [personnelOptions] =
    trpc.customers.getAvailablePersonnelByAppointmentId.useSuspenseQuery({
      appointmentId,
    });

  const [transactionOptions] =
    trpc.transactions.getTransactionOptions.useSuspenseQuery();

  const showEditAppointmentDrawer = useSetAtom(editAppointmentDrawerAtom);

  return (
    <Grid>
      <GridCol span={12}>
        <Paper withBorder p="md" radius="md" shadow="sm">
          <Group justify="space-between">
            <Title order={4}>{appointment.name}</Title>
            <Group>
              <Button
                onClick={() => {
                  showEditAppointmentDrawer({ isOpen: true, appointment });
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
                  transactionOptions={transactionOptions}
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
                <PersonnelPickerModal
                  appointmentId={appointmentId}
                  personnelOptions={personnelOptions}
                />
              </Group>
              <PersonnelTable
                appointmentId={appointmentId}
                personnel={personnel}
                transactionOptions={transactionOptions}
              />
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
          <TransactionsTable
            appointmentId={appointmentId}
            transactionAllocations={transactionAllocations}
          />
        </Paper>
      </GridCol>
    </Grid>
  );
}
