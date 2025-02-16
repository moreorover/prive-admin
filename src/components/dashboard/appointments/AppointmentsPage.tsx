"use client";

import { Grid, GridCol, Paper } from "@mantine/core";
import { Appointment } from "@/lib/schemas";
import { PageContainer } from "@/components/page_container/PageContainer";
import AppointmentsTable from "@/components/dashboard/appointments/AppointmentsTable";

interface Props {
  appointments: Appointment[];
}

export default function AppointmentsPage({ appointments }: Props) {
  return (
    <PageContainer title="Appointments">
      <Grid>
        <GridCol span={{ sm: 12, md: 12, lg: 12 }}>
          <Paper
            style={{
              display: "flex",
              justifyContent: "flex-end",
              width: "100%",
            }}
          >
            {/*<Button*/}
            {/*  onClick={() => {*/}
            {/*    showNewAppointmentDrawer({ isOpen: true });*/}
            {/*  }}*/}
            {/*>*/}
            {/*  New*/}
            {/*</Button>*/}
          </Paper>
        </GridCol>
        <GridCol span={{ sm: 12, md: 12, lg: 12 }}>
          <AppointmentsTable appointments={appointments} />
        </GridCol>
      </Grid>
    </PageContainer>
  );
}
