"use client";

import {
  Button,
  Container,
  Grid,
  GridCol,
  Group,
  Paper,
  Space,
  Text,
  Title,
} from "@mantine/core";
import { trpc } from "@/trpc/client";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import { Suspense, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { LoaderSkeleton } from "@/components/loader-skeleton";
import { AppointmentsTable } from "@/modules/appointments/ui/components/appointments-table";

dayjs.extend(isoWeek);

interface Props {
  weekOffset: number;
}

export const AppointmentsView = ({ weekOffset }: Props) => {
  const [offset, setOffset] = useState(weekOffset);
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
          <Suspense fallback={<LoaderSkeleton />}>
            <ErrorBoundary fallback={<p>Error</p>}>
              <AppointmentsSuspense weekOffset={offset} />
            </ErrorBoundary>
          </Suspense>
        </GridCol>
      </Grid>
    </Container>
  );
};

function AppointmentsSuspense({ weekOffset }: Props) {
  const [appointments] =
    trpc.appointments.getAppointmentsForWeek.useSuspenseQuery({
      offset: weekOffset,
    });

  return (
    <GridCol span={12}>
      {appointments.length > 0 ? (
        <AppointmentsTable appointments={appointments} />
      ) : (
        <Paper shadow="xs" p="xl">
          <Text c="gray">No appointments found for this week.</Text>
        </Paper>
      )}
    </GridCol>
  );
}
