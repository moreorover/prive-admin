"use client";

import {Button, Center, Grid, GridCol, Group, Paper, Stack, Text, Title,} from "@mantine/core";
import {trpc} from "@/trpc/client";
import {Suspense} from "react";
import {ErrorBoundary} from "react-error-boundary";
import {LoaderSkeleton} from "@/components/loader-skeleton";
import dayjs from "dayjs";
import {AppointmentTransactionMenu} from "@/modules/appointments/ui/components/appointment-transaction-menu";
import PersonnelTable from "@/modules/appointments/ui/components/personnel-table";
import TransactionsTable from "@/modules/appointments/ui/components/transactions-table";
import {PersonnelPickerModal} from "@/modules/appointments/ui/components/personnel-picker-modal";
import {editAppointmentDrawerAtom} from "@/lib/atoms";
import {useSetAtom} from "jotai";
import AppointmentNotesTable from "@/modules/appointments/ui/components/notes-table";
import {useAppointmentNoteDrawerStore} from "@/modules/appointment_notes/ui/appointment-note-drawer-store";
import {DonutChart} from "@mantine/charts";

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
  const openNewAppointmentNoteDrawer = useAppointmentNoteDrawerStore(
    (state) => state.openDrawer,
  );

  return (
    <Grid grow>
      <GridCol span={{ base: 12, lg: 3 }}>
        <Stack>
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
          <Paper withBorder p="md" radius="md" shadow="sm">
            <Group justify="space-between" gap="sm">
              <Title order={4}>Appointment Details</Title>
              <Button
                onClick={() => {
                  showEditAppointmentDrawer({ isOpen: true, appointment });
                }}
              >
                Edit
              </Button>
            </Group>
            <Text size="sm" mt="xs">
              <strong>Scheduled At:</strong>{" "}
              {dayjs(appointment.startsAt).format("DD MMMM YYYY HH:mm")}
            </Text>
          </Paper>
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
          <Paper withBorder p="md" radius="md" shadow="sm">
            <Text size="lg" fw={700} ta="center">
              Profit
            </Text>
            <Text size="md" ta="center" fw={500} mt="sm">
              Total: <b>£ {(transactionsTotal).toFixed(2)}</b>
            </Text>
          </Paper>
        </Stack>
      </GridCol>
      <GridCol span={{ base: 12, lg: 9 }}>
        <Stack>
          <Paper withBorder p="md" radius="md" shadow="sm">
            <Group justify="space-between" gap="sm">
              <Title order={4}>Notes</Title>
              <Button
                onClick={() => {
                  openNewAppointmentNoteDrawer({
                    appointmentId,
                    isOpen: true,
                    onCreated: () => {
                      utils.appointmentNotes.getNotesByAppointmentId.invalidate(
                        {
                          appointmentId,
                        },
                      );
                    },
                  });
                }}
              >
                New
              </Button>
            </Group>
            <AppointmentNotesTable
              appointmentId={appointmentId}
              notes={notes}
            />
          </Paper>
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
          <Paper withBorder p="md" radius="md" shadow="sm">
            <Group justify="space-between" gap="sm">
              <Title order={4}>Transactions</Title>
            </Group>
            <TransactionsTable
              appointmentId={appointmentId}
              transactions={transactions}
            />
          </Paper>
        </Stack>
      </GridCol>
    </Grid>
  );
}
