"use client";

import {
  Button,
  Grid,
  GridCol,
  Group,
  Paper,
  Text,
  Title,
} from "@mantine/core";
import { trpc } from "@/trpc/client";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { LoaderSkeleton } from "@/components/loader-skeleton";
import { AppointmentsTable } from "@/modules/appointments/ui/components/appointments-table";
import useCounter from "@/hooks/useCounter";

dayjs.extend(isoWeek);

interface Props {
  offset: number;
}

export const AppointmentsView = ({ offset }: Props) => {
  const { count, increase, decrease, reset } = useCounter(offset);

  const startOfWeek = dayjs().isoWeekday(1).add(count, "week").startOf("day");
  const endOfWeek = dayjs().isoWeekday(7).add(count, "week").endOf("day");

  return (
    <Grid>
      <GridCol span={12}>
        <Paper withBorder p="md" radius="md" shadow="sm">
          <Group justify="space-between">
            <Title order={4}>Appointments</Title>
            <Group>
              {count != 0 && (
                <Button onClick={reset} variant="light" color="cyan">
                  Current Week
                </Button>
              )}
              <Button variant="light" onClick={decrease}>
                Previous Week
              </Button>
              <Text>
                {startOfWeek.format("MMM D, YYYY")} -{" "}
                {endOfWeek.format("MMM D, YYYY")}
              </Text>
              <Button variant="light" onClick={increase}>
                Next Week
              </Button>
            </Group>
          </Group>
        </Paper>
      </GridCol>
      <GridCol span={12}>
        <Suspense fallback={<LoaderSkeleton />}>
          <ErrorBoundary fallback={<p>Error</p>}>
            <AppointmentsSuspense offset={count} />
          </ErrorBoundary>
        </Suspense>
      </GridCol>
    </Grid>
  );
};

function AppointmentsSuspense({ offset }: Props) {
  const [appointments] =
    trpc.appointments.getAppointmentsForWeek.useSuspenseQuery({
      offset,
    });

  return (
    <>
      {appointments.length > 0 ? (
        <AppointmentsTable appointments={appointments} />
      ) : (
        <Paper withBorder p="md" radius="md" shadow="sm">
          <Text c="gray">No appointments found for this week.</Text>
        </Paper>
      )}
    </>
  );
}
