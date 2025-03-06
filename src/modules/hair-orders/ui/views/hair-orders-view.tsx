"use client";

import {
  Button,
  Divider,
  Flex,
  Grid,
  GridCol,
  Paper,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { LoaderSkeleton } from "@/components/loader-skeleton";
import Surface from "@/modules/ui/components/surface";
import { FilterDateMenu } from "@/modules/ui/components/filter-date-menu";
import useDateRange from "@/modules/ui/hooks/useDateRange";
import { useRouter } from "next/navigation";
import { modals } from "@mantine/modals";
import { trpc } from "@/trpc/client";
import { notifications } from "@mantine/notifications";
import HairOrdersTable from "@/modules/hair-orders/ui/components/hair-orders-table";

dayjs.extend(isoWeek);

interface Props {
  startDate: string;
  endDate: string;
}

export const HairOrdersView = () => {
  const utils = trpc.useUtils();
  const router = useRouter();
  const { start, end, range, rangeText, createQueryString } = useDateRange();

  const createHairOrderMutation = trpc.hairOrders.create.useMutation({
    onSuccess: () => {
      utils.hairOrders.getAll.invalidate();
      notifications.show({
        color: "green",
        title: "Success!",
        message: "Appointment Note updated.",
      });
    },
    onError: (err) => {
      notifications.show({
        color: "red",
        title: "Failed to create Hair Order.",
        message: `${err}`,
      });
    },
  });

  const openCreateHairOrderModal = () =>
    modals.openConfirmModal({
      title: "Create Hair Order?",
      centered: true,
      children: (
        <Text size="sm">Are you sure you want to create new Hair Order?</Text>
      ),
      labels: { confirm: "Create Hair Order", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onCancel: () => {},
      onConfirm: () => createHairOrderMutation.mutate(),
    });

  return (
    <Stack gap="sm">
      <Surface component={Paper} style={{ backgroundColor: "transparent" }}>
        <Flex
          justify="space-between"
          direction={{ base: "column", sm: "row" }}
          gap={{ base: "sm", sm: 4 }}
        >
          <Stack gap={4}>
            <Title order={3}>Hair Orders</Title>
            {/*<Text></Text>*/}
          </Stack>
          <Flex align="center" gap="sm">
            {/*<ActionIcon variant="subtle">*/}
            {/*  <RefreshCw size={16} />*/}
            {/*</ActionIcon>*/}
            <FilterDateMenu
              range={range}
              rangeInText={rangeText}
              onSelected={(range) =>
                router.push(`/dashboard/hair-orders${createQueryString(range)}`)
              }
            />
            <Button onClick={openCreateHairOrderModal}>New</Button>
          </Flex>
        </Flex>
      </Surface>
      <Divider />
      <Grid gutter={{ base: 5, xs: "md", md: "lg" }}>
        <GridCol span={12}>
          <Suspense fallback={<LoaderSkeleton />}>
            <ErrorBoundary fallback={<p>Error</p>}>
              <HairOrdersSuspense startDate={start} endDate={end} />
            </ErrorBoundary>
          </Suspense>
        </GridCol>
      </Grid>
    </Stack>
  );
};

function HairOrdersSuspense({ startDate, endDate }: Props) {
  const [hairOrders] = trpc.hairOrders.getAll.useSuspenseQuery();
  return (
    <>
      <Stack gap="lg">
        <Paper withBorder p="md" radius="md" shadow="sm">
          {hairOrders.length > 0 ? (
            <HairOrdersTable hairOrders={hairOrders} />
          ) : (
            <Text c="gray">
              No hair orders found for following dates: {startDate} {endDate}.
            </Text>
          )}
        </Paper>
      </Stack>
    </>
  );
}
