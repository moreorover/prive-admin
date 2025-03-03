"use client";

import {
  Button,
  Center,
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
import { DonutChart } from "@mantine/charts";
import AppointmentNotesTable from "@/modules/appointments/ui/components/notes-table";
import { useAppointmentNoteDrawerStore } from "@/modules/appointment_notes/ui/appointment-note-drawer-store";

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
  const utils = trpc.useUtils();
  const [appointment] = trpc.appointments.getOne.useSuspenseQuery({
    id: appointmentId,
  });

  const [personnel] =
    trpc.customers.getPersonnelByAppointmentId.useSuspenseQuery({
      appointmentId,
    });

  const [transactions] = trpc.transactions.getByAppointmentId.useSuspenseQuery({
    appointmentId,
    includeCustomer: true,
  });

  const [personnelOptions] =
    trpc.customers.getAvailablePersonnelByAppointmentId.useSuspenseQuery({
      appointmentId,
    });

  const [notes] =
    trpc.appointmentNotes.getNotesByAppointmentId.useSuspenseQuery({
      appointmentId,
    });

  const transactionsTotal = transactions.reduce(
    (sum, transaction) => sum + transaction.amount,
    0,
  );

  const transactionsCompletedTotal = transactions
    .filter((transaction) => transaction.status === "COMPLETED")
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const transactionsPendingTotal = transactions
    .filter((transaction) => transaction.status === "PENDING")
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  const chartData = [
    {
      name: "Completed",
      value:
        transactionsCompletedTotal < 0
          ? transactionsCompletedTotal * -1
          : transactionsCompletedTotal,
      color: "green.4",
    }, // Green
    {
      name: "Outstanding",
      value:
        transactionsPendingTotal < 0
          ? transactionsPendingTotal * -1
          : transactionsPendingTotal,
      color: "pink.6",
    }, // Red
  ];

  const showEditAppointmentDrawer = useSetAtom(editAppointmentDrawerAtom);
  const openNewAppointmentDrawer = useAppointmentNoteDrawerStore(
    (state) => state.openDrawer,
  );

  return (
    <Grid grow align="center">
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
      <GridCol span={4}>
        <Paper withBorder p="md" radius="md" shadow="sm">
          <Title order={4}>Appointment Details</Title>
          <Text size="sm" mt="xs">
            <strong>Start Time:</strong>{" "}
            {dayjs(appointment.startsAt).format("DD MMM YYYY HH:mm")}
          </Text>
        </Paper>
      </GridCol>
      <GridCol span={3}>
        <Paper withBorder p="md" radius="md" shadow="sm">
          <Text size="lg" fw={700} ta="center">
            Transactions Summary
          </Text>
          <Center>
            <DonutChart size={124} thickness={15} data={chartData} />
          </Center>
          <Text size="md" ta="center" fw={500} mt="sm">
            Total: <b>£ {transactionsTotal.toFixed(2)}</b>
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
                  customer={appointment.client}
                />
              </Group>
              <Text size="sm" mt="xs">
                <strong>Name:</strong> {appointment.client.name}
              </Text>
              <Text size="sm" mt="xs">
                <strong>Number:</strong> {appointment.client.phoneNumber}
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
            transactions={transactions}
          />
        </Paper>
      </GridCol>

      {/* Notes */}
      <GridCol span={12}>
        <Paper withBorder p="md" radius="md" shadow="sm">
          <Group justify="space-between" gap="sm">
            <Title order={4}>Notes</Title>
            <Button
              onClick={() => {
                openNewAppointmentDrawer({
                  appointmentId,
                  isOpen: true,
                  onCreated: () => {
                    utils.appointmentNotes.getNotesByAppointmentId.invalidate({
                      appointmentId,
                    });
                  },
                });
              }}
            >
              New
            </Button>
          </Group>
          <AppointmentNotesTable appointmentId={appointmentId} notes={notes} />
        </Paper>
      </GridCol>
    </Grid>
  );
}
