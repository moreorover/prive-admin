"use client";

import { Grid, GridCol, Group, Paper, Text, Title } from "@mantine/core";
import { trpc } from "@/trpc/client";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { LoaderSkeleton } from "@/components/loader-skeleton";
import { AppointmentsTable } from "@/modules/appointments/ui/components/appointments-table";
import useDateRange from "@/modules/ui/hooks/useDateRange";
import { DateRangeDrawer } from "@/modules/ui/components/date-range-drawer";

dayjs.extend(isoWeek);

interface Props {
  startDate: string;
  endDate: string;
}

export const AppointmentsView = () => {
  const { start, end, startAsDate, endAsDate, rangeText, setStartAndEnd } =
    useDateRange();

  return (
    <Grid>
      <GridCol span={12}>
        <Paper withBorder p="md" radius="md" shadow="sm">
          <Group justify="space-between">
            <Title order={4}>Appointments</Title>
            <Group>
              <Text>{rangeText}</Text>
              <DateRangeDrawer
                start={startAsDate}
                end={endAsDate}
                onConfirm={setStartAndEnd}
              />
            </Group>
          </Group>
        </Paper>
      </GridCol>
      <GridCol span={12}>
        <Suspense fallback={<LoaderSkeleton />}>
          <ErrorBoundary fallback={<p>Error</p>}>
            <AppointmentsSuspense startDate={start} endDate={end} />
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
