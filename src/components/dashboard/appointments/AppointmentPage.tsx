"use client";

import { Button, Grid, GridCol, Paper } from "@mantine/core";
import { Appointment } from "@/lib/schemas";
import { PageContainer } from "@/components/page_container/PageContainer";
import { useSetAtom } from "jotai";
import { editAppointmentDrawerAtom } from "@/lib/atoms";

interface Props {
  appointment: Appointment;
}

export default function AppointmentPage({ appointment }: Props) {
  const showEditAppointmentDrawer = useSetAtom(editAppointmentDrawerAtom);
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
      </Grid>
    </PageContainer>
  );
}
