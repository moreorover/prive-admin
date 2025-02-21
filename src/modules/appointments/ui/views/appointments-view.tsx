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
import Link from "next/link";

dayjs.extend(isoWeek);

interface Props {
  weekOffset: number;
}

export const AppointmentsView = ({ weekOffset }: Props) => {
  const startOfWeek = dayjs()
    .isoWeekday(1)
    .add(weekOffset, "week")
    .startOf("day");
  const endOfWeek = dayjs().isoWeekday(7).add(weekOffset, "week").endOf("day");

  return (
    <Grid>
      <GridCol span={12}>
        <Paper withBorder p="md" radius="md" shadow="sm">
          <Group justify="space-between">
            <Title order={4}>Appointments</Title>
            <Group>
              {weekOffset != 0 && (
                <Button
                  component={Link}
                  href={"/dashboard/appointments?weekOffset=0"}
                  variant="light"
                  color="cyan"
                >
                  Current Week
                </Button>
              )}
              <Button
                variant="light"
                component={Link}
                href={"/dashboard/appointments?weekOffset=" + (weekOffset - 1)}
              >
                Previous Week
              </Button>
              <Text>
                {startOfWeek.format("MMM D, YYYY")} -{" "}
                {endOfWeek.format("MMM D, YYYY")}
              </Text>
              <Button
                variant="light"
                component={Link}
                href={"/dashboard/appointments?weekOffset=" + (weekOffset + 2)}
              >
                Next Week
              </Button>
            </Group>
          </Group>
        </Paper>
      </GridCol>
      <GridCol span={12}>
        <Suspense fallback={<LoaderSkeleton />}>
          <ErrorBoundary fallback={<p>Error</p>}>
            <AppointmentsSuspense weekOffset={weekOffset} />
          </ErrorBoundary>
        </Suspense>
      </GridCol>
    </Grid>
  );
};

function AppointmentsSuspense({ weekOffset }: Props) {
  const [appointments] =
    trpc.appointments.getAppointmentsForWeek.useSuspenseQuery({
      offset: weekOffset,
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
