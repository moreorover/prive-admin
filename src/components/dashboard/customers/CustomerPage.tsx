"use client";

import { Button, Grid, GridCol, Group, Paper, Title } from "@mantine/core";
import { Appointment, Customer, Order } from "@/lib/schemas";
import { PageContainer } from "@/components/page_container/PageContainer";
import { useSetAtom } from "jotai";
import {
  editCustomerDrawerAtom,
  newAppointmentDrawerAtom,
  newOrderDrawerAtom,
} from "@/lib/atoms";
import SimpleOrdersTable from "@/components/dashboard/orders/SimpleOrdersTable";
import AppointmentsTable from "@/components/dashboard/appointments/AppointmentsTable";

interface Props {
  customer: Customer;
  orders: Order[];
  appointments: Appointment[];
}

export default function CustomerPage({
  customer,
  orders,
  appointments,
}: Props) {
  const showEditCustomerDrawer = useSetAtom(editCustomerDrawerAtom);
  const showNewOrderDrawer = useSetAtom(newOrderDrawerAtom);
  const showNewAppointmentDrawer = useSetAtom(newAppointmentDrawerAtom);
  return (
    <PageContainer title={customer.name}>
      <Grid>
        <GridCol span={{ sm: 12, md: 12, lg: 12 }}>
          <Paper
            style={{
              display: "flex",
              justifyContent: "flex-end",
              width: "100%",
            }}
          >
            <Group gap={"sm"}>
              <Button
                onClick={() => {
                  showEditCustomerDrawer({ isOpen: true, customer });
                }}
              >
                Edit
              </Button>
            </Group>
          </Paper>
        </GridCol>
        <GridCol span={{ sm: 12, md: 12, lg: 12 }}>
          <Paper
            style={{
              padding: "16px",
              borderRadius: "8px",
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
              <Title order={4}>Orders</Title>
              <Button
                onClick={() => {
                  showNewOrderDrawer({
                    isOpen: true,
                    customerId: customer.id!,
                  });
                }}
              >
                New
              </Button>
            </div>
            <SimpleOrdersTable orders={orders} />
          </Paper>
          <Paper
            style={{
              padding: "16px",
              borderRadius: "8px",
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
              <Title order={4}>Appointments</Title>
              <Button
                onClick={() => {
                  showNewAppointmentDrawer({
                    isOpen: true,
                    clientId: customer.id!,
                  });
                }}
              >
                New
              </Button>
            </div>
            <AppointmentsTable appointments={appointments} />
          </Paper>
        </GridCol>
      </Grid>
    </PageContainer>
  );
}
