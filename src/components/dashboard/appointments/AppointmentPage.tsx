"use client";

import { Button, Grid, GridCol, Paper, Title } from "@mantine/core";
import { Appointment, Order } from "@/lib/schemas";
import { PageContainer } from "@/components/page_container/PageContainer";
import { useSetAtom } from "jotai";
import {
  editAppointmentDrawerAtom,
  newAppointmentDrawerAtom,
} from "@/lib/atoms";
import SimpleOrdersTable from "@/components/dashboard/orders/SimpleOrdersTable";

interface Props {
  appointment: Appointment;
  orders: Order[];
}

export default function AppointmentPage({ appointment, orders }: Props) {
  const showEditAppointmentDrawer = useSetAtom(editAppointmentDrawerAtom);
  const showNewAppointmentDrawer = useSetAtom(newAppointmentDrawerAtom);
  return (
    <PageContainer title={appointment.name}>
      <Grid>
        <GridCol span={{ sm: 12, md: 12, lg: 12 }}>
          <Paper
            style={{
              display: "flex",
              justifyContent: "flex-end",
              width: "100%",
            }}
          >
            <Button
              onClick={() => {
                showEditAppointmentDrawer({ isOpen: true, appointment });
              }}
            >
              Edit
            </Button>
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
                  showNewAppointmentDrawer({
                    isOpen: true,
                  });
                }}
              >
                New
              </Button>
            </div>
            <SimpleOrdersTable orders={orders} />
          </Paper>
        </GridCol>
      </Grid>
    </PageContainer>
  );
}
