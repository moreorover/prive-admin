"use client";

import {
  Button,
  Grid,
  GridCol,
  Group,
  Paper,
  Title,
  Text,
} from "@mantine/core";
import { Appointment, Customer, Transaction } from "@/lib/schemas";
import { PageContainer } from "@/components/page_container/PageContainer";
import { useSetAtom } from "jotai";
import { editAppointmentDrawerAtom } from "@/lib/atoms";
// import PersonnelTable from "@/components/dashboard/personnel/PersonnelTable";
import TransactionsTable from "@/components/dashboard/transactions/TransactionsTable";
import dayjs from "dayjs";

interface Props {
  appointment: Appointment;
  client: Customer;
  transactions: Transaction[];
}

export default function AppointmentPage({
  appointment,
  transactions,
  client,
}: Props) {
  const showEditAppointmentDrawer = useSetAtom(editAppointmentDrawerAtom);

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
                <Title order={4}>Client</Title>
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
                </div>
                {/*<PersonnelTable personnel={personnel} />*/}
                Personnel Table..
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
