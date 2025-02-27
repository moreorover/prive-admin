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
import useWeekOffset from "@/hooks/useWeekOffset";

dayjs.extend(isoWeek);

interface Props {
  startDate: string;
  endDate: string;
}

export const AppointmentsView = () => {
  const {
    isCurrentWeek,
    startOfWeek,
    endOfWeek,
    addWeek,
    subtractWeek,
    resetWeek,
  } = useWeekOffset();

  return (
    <Grid>
      <GridCol span={12}>
        <Paper withBorder p="md" radius="md" shadow="sm">
          <Group justify="space-between">
            <Title order={4}>Appointments</Title>
            <Group>
              {!isCurrentWeek && (
                <Button onClick={resetWeek} variant="light" color="cyan">
                  Current Week
                </Button>
              )}
              <Button variant="light" onClick={subtractWeek}>
                Previous Week
              </Button>
              <Text>
                {dayjs(startOfWeek).format("MMM D, YYYY")} -{" "}
                {dayjs(endOfWeek).format("MMM D, YYYY")}
              </Text>
              <Button variant="light" onClick={addWeek}>
                Next Week
              </Button>
            </Group>
          </Group>
        </Paper>
      </GridCol>
      <GridCol span={12}>
        <Suspense fallback={<LoaderSkeleton />}>
          <ErrorBoundary fallback={<p>Error</p>}>
            <AppointmentsSuspense startDate={startOfWeek} endDate={endOfWeek} />
          </ErrorBoundary>
        </Suspense>
      </GridCol>
    </Grid>
  );
};

function AppointmentsSuspense({ startDate, endDate }: Props) {
  const [appointments] =
    trpc.appointments.getAppointmentsBetweenDates.useSuspenseQuery({
      startDate,
      endDate,
    });

  return (
    <>
      <Paper withBorder p="md" radius="md" shadow="sm">
        {appointments.length > 0 ? (
          <AppointmentsTable appointments={appointments} />
        ) : (
          <Text c="gray">No appointments found for this week.</Text>
        )}
      </Paper>
    </>
  );
}
