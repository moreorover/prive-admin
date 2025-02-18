"use client";

import {
  Button,
  Grid,
  GridCol,
  Group,
  Paper,
  Title,
  Text,
  Menu,
} from "@mantine/core";
import { Appointment, Customer, Transaction } from "@/lib/schemas";
import { PageContainer } from "@/components/page_container/PageContainer";
import { useSetAtom } from "jotai";
import {
  editAppointmentDrawerAtom,
  newTransactionDrawerAtom,
  personnelPickerModalAtom,
  transactionPickerModalAtom,
} from "@/lib/atoms";
import TransactionsTable from "@/components/dashboard/transactions/TransactionsTable";
import dayjs from "dayjs";
import { notifications } from "@mantine/notifications";
import { linkPersonnelWithAppointment } from "@/data-access/appointmentPersonnel";
import PersonnelTable from "@/components/dashboard/appointments/PersonnelTable";
import { linkTransactionsWithAppointment } from "@/data-access/transaction";

interface Props {
  appointment: Appointment;
  client: Customer;
  transactions: Transaction[];
  personnelOptions: Customer[];
  personnel: Customer[];
  transactionOptions: Transaction[];
}

export default function AppointmentPage({
  appointment,
  transactions,
  client,
  personnelOptions,
  personnel,
  transactionOptions,
}: Props) {
  const showEditAppointmentDrawer = useSetAtom(editAppointmentDrawerAtom);
  const showPersonnelPickerModal = useSetAtom(personnelPickerModalAtom);
  const showNewTransactionDrawer = useSetAtom(newTransactionDrawerAtom);
  const showPickTransactionModal = useSetAtom(transactionPickerModalAtom);

  async function onConfirmActionPersonnel(selectedRows: string[]) {
    const response = await linkPersonnelWithAppointment(
      selectedRows,
      appointment.id!,
    );

    if (response.type === "ERROR") {
      notifications.show({
        color: "red",
        title: "Failed to link Transactions",
        message: response.message,
      });
    } else {
      notifications.show({
        color: "green",
        title: "Success!",
        message: response.message,
      });
    }
  }

  async function onConfirmActionTransactions(selectedRows: string[]) {
    const response = await linkTransactionsWithAppointment(
      selectedRows,
      appointment.id!,
      client.id!,
    );

    if (response.type === "ERROR") {
      notifications.show({
        color: "red",
        title: "Failed to link Transactions",
        message: response.message,
      });
    } else {
      notifications.show({
        color: "green",
        title: "Success!",
        message: response.message,
      });
    }
  }

  return (
    <PageContainer title={appointment.name}>
      <Grid>
        {/* Header and Actions */}
        <GridCol span={{ sm: 12, md: 12, lg: 12 }}>
          <Paper
            style={{
              // display: "flex",
              // justifyContent: "flex-end",
              width: "100%",
              padding: "16px",
            }}
          >
            <Group justify="space-between" gap="sm">
              <Title order={4}>{appointment.name}</Title>
              <Button
                onClick={() => {
                  showEditAppointmentDrawer({ isOpen: true, appointment });
                }}
              >
                Edit
              </Button>
            </Group>
          </Paper>
        </GridCol>

        {/* Appointment Details */}
        <GridCol span={{ sm: 12, md: 12, lg: 12 }}>
          <Paper style={{ padding: "16px", borderRadius: "8px" }}>
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

        {/* Client and Personnel */}
        <GridCol span={{ sm: 12, md: 12, lg: 12 }}>
          <Grid>
            {/* Client Card */}
            <GridCol span={{ sm: 12, md: 3, lg: 3 }}>
              <Paper
                style={{
                  padding: "16px",
                  borderRadius: "8px",
                  marginTop: "16px",
                }}
              >
                <Group justify="space-between" gap="sm">
                  <Title order={4}>Client</Title>
                  <Menu shadow="md" width={200}>
                    <Menu.Target>
                      <Button>Manage</Button>
                    </Menu.Target>

                    <Menu.Dropdown>
                      <Menu.Label>Transactions</Menu.Label>
                      <Menu.Item
                        onClick={() => {
                          showNewTransactionDrawer({
                            isOpen: true,
                            orderId: null,
                            appointmentId: appointment.id!,
                            customerId: client.id!,
                          });
                        }}
                      >
                        New Cash Transaction
                      </Menu.Item>
                      <Menu.Item
                        onClick={() => {
                          showPickTransactionModal({
                            isOpen: true,
                            transactions: transactionOptions,
                            onConfirmAction: onConfirmActionTransactions,
                          });
                        }}
                      >
                        Pick Transaction
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </Group>
                <Text size="sm" mt="xs">
                  <strong>Name:</strong> {client.name}
                </Text>
              </Paper>
            </GridCol>

            {/* Personnel Involved */}
            <GridCol span={{ sm: 12, md: 9, lg: 9 }}>
              <Paper
                style={{
                  padding: "16px",
                  borderRadius: "8px",
                  marginTop: "16px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "16px",
                  }}
                >
                  <Title order={4}>Personnel Involved</Title>
                  <Button
                    onClick={() => {
                      showPersonnelPickerModal({
                        isOpen: true,
                        personnel: personnelOptions,
                        onConfirmAction: onConfirmActionPersonnel,
                      });
                    }}
                  >
                    Pick
                  </Button>
                </div>
                <PersonnelTable
                  personnel={personnel}
                  transactionOptions={transactionOptions}
                  appointmentId={appointment.id!}
                />
              </Paper>
            </GridCol>
          </Grid>
        </GridCol>

        {/* Transactions Related to Appointment */}
        <GridCol span={{ sm: 12, md: 12, lg: 12 }}>
          <Paper
            style={{ padding: "16px", borderRadius: "8px", marginTop: "16px" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <Title order={4}>Transactions</Title>
            </div>
            <TransactionsTable transactions={transactions} />
          </Paper>
        </GridCol>
      </Grid>
    </PageContainer>
  );
}
