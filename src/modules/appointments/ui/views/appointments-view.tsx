"use client";

import {
  Button,
  Container,
  Grid,
  GridCol,
  Paper,
  Space,
  Title,
  Group,
  Text,
} from "@mantine/core";
import AppointmentsTable from "@/components/dashboard/appointments/AppointmentsTable";
import { trpc } from "@/trpc/client";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import { useState } from "react";

dayjs.extend(isoWeek);

export default function AppointmentsView() {
  const [weekOffset, setWeekOffset] = useState(0);

  const [appointments] =
    trpc.appointments.getAppointmentsForWeek.useSuspenseQuery({
      offset: weekOffset,
    });

  const startOfWeek = dayjs()
    .isoWeekday(1)
    .add(weekOffset, "week")
    .startOf("day");
  const endOfWeek = dayjs().isoWeekday(7).add(weekOffset, "week").endOf("day");

  return (
    <Container px={0} fluid>
      <Space h="lg" />
      <Grid>
        <GridCol span={12}>
          <Paper withBorder p="md" radius="md" shadow="sm">
            <Group justify="space-between">
              <Title order={4}>Appointments</Title>
              <Group>
                {weekOffset != 0 && (
                  <Button
                    variant="light"
                    onClick={() => setWeekOffset(0)}
                    color="cyan"
                  >
                    Current Week
                  </Button>
                )}
                <Button
                  variant="light"
                  onClick={() => setWeekOffset(weekOffset - 1)}
                >
                  Previous Week
                </Button>
                <Text>
                  {startOfWeek.format("MMM D, YYYY")} -{" "}
                  {endOfWeek.format("MMM D, YYYY")}
                </Text>
                <Button
                  variant="light"
                  onClick={() => setWeekOffset(weekOffset + 1)}
                >
                  Next Week
                </Button>
              </Group>
            </Group>
          </Paper>
        </GridCol>
        <GridCol span={12}>
          <AppointmentsTable appointments={appointments} />
        </GridCol>
      </Grid>
    </Container>
  );
}
