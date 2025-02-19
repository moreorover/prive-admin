"use client";

import {
  Button,
  Container,
  Grid,
  GridCol,
  Paper,
  Space,
  Title,
} from "@mantine/core";
import AppointmentsTable from "@/components/dashboard/appointments/AppointmentsTable";
import { trpc } from "@/trpc/client";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import { useState } from "react";

dayjs.extend(isoWeek);

interface Props {}

export default function AppointmentsView({}: Props) {
  const [weekOffset, setWeekOffset] = useState(0);

  const [appointments] =
    trpc.appointments.getAppointmentsForWeek.useSuspenseQuery({
      offset: weekOffset,
    });

  const startOfWeek = dayjs()
    .isoWeekday(1)
    .add(weekOffset, "week")
    .startOf("day"); // Monday start
  const endOfWeek = dayjs().isoWeekday(7).add(weekOffset, "week").endOf("day"); // Sunday end

  return (
    <Container px={0} fluid={true}>
      <Space h="lg" />
      <Grid>
        <GridCol span={{ sm: 12, md: 12, lg: 12 }}>
          <Paper
            style={{
              display: "flex",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <Title order={4}>Appointments</Title>
            <div>
              <Button onClick={() => setWeekOffset(weekOffset - 1)}>-1</Button>
              <p>{startOfWeek.format("YYYY-MM-DD HH:mm:ss")}</p>
              <p>{endOfWeek.format("YYYY-MM-DD HH:mm:ss")}</p>
              <Button onClick={() => setWeekOffset(weekOffset + 1)}>+1</Button>
            </div>
          </Paper>
        </GridCol>
        <GridCol span={{ sm: 12, md: 12, lg: 12 }}>
          <AppointmentsTable appointments={appointments} />
        </GridCol>
      </Grid>
    </Container>
  );
}
