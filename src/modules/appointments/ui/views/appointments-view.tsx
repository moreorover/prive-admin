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
import { Suspense, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { LoaderSkeleton } from "@/components/loader-skeleton";

dayjs.extend(isoWeek);

interface Props {
  weekOffset: number;
}

export const AppointmentsView = () => {
  return (
    <Suspense fallback={<LoaderSkeleton />}>
      <ErrorBoundary fallback={<p>Error</p>}>
        <AppointmentsSuspense weekOffset={0} />
      </ErrorBoundary>
    </Suspense>
  );
};

function AppointmentsSuspense({ weekOffset }: Props) {
  const [offset, setOffset] = useState(weekOffset);

  const [appointments] =
    trpc.appointments.getAppointmentsForWeek.useSuspenseQuery({
      offset: offset,
    });

  const startOfWeek = dayjs().isoWeekday(1).add(offset, "week").startOf("day");
  const endOfWeek = dayjs().isoWeekday(7).add(offset, "week").endOf("day");

  return (
    <Container px={0} fluid>
      <Space h="lg" />
      <Grid>
        <GridCol span={12}>
          <Paper withBorder p="md" radius="md" shadow="sm">
            <Group justify="space-between">
              <Title order={4}>Appointments</Title>
              <Group>
                {offset != 0 && (
                  <Button
                    variant="light"
                    onClick={() => setOffset(0)}
                    color="cyan"
                  >
                    Current Week
                  </Button>
                )}
                <Button variant="light" onClick={() => setOffset(offset - 1)}>
                  Previous Week
                </Button>
                <Text>
                  {startOfWeek.format("MMM D, YYYY")} -{" "}
                  {endOfWeek.format("MMM D, YYYY")}
                </Text>
                <Button variant="light" onClick={() => setOffset(offset + 1)}>
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
