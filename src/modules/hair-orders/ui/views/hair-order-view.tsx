"use client";

import {
  Button,
  Divider,
  Flex,
  Grid,
  GridCol,
  Group,
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
import { trpc } from "@/trpc/client";
import { useHairOrderNoteDrawerStore } from "@/modules/hair_order_notes/ui/hair-order-note-drawer-store";
import HairOrderNotesTable from "@/modules/hair-orders/ui/components/notes-table";
import TransactionsTable from "@/modules/hair-orders/ui/components/transactions-table";
import { CustomerPickerModal } from "@/modules/ui/components/customer-picker-modal";
import { notifications } from "@mantine/notifications";
import { DatePickerDrawer } from "@/modules/ui/components/date-picker-drawer";

dayjs.extend(isoWeek);

interface Props {
  hairOrderId: string;
}

export const HairOrderView = ({ hairOrderId }: Props) => {
  return (
    <Stack gap="sm">
      <Surface component={Paper} style={{ backgroundColor: "transparent" }}>
        <Flex
          justify="space-between"
          direction={{ base: "column", sm: "row" }}
          gap={{ base: "sm", sm: 4 }}
        >
          <Stack gap={4}>
            <Title order={3}>Hair Order</Title>
            {/*<Text></Text>*/}
          </Stack>
          <Flex align="center" gap="sm">
            {/*<ActionIcon variant="subtle">*/}
            {/*  <RefreshCw size={16} />*/}
            {/*</ActionIcon>*/}
          </Flex>
        </Flex>
      </Surface>
      <Divider />
      <Grid gutter={{ base: 5, xs: "md", md: "lg" }}>
        <GridCol span={12}>
          <Suspense fallback={<LoaderSkeleton />}>
            <ErrorBoundary fallback={<p>Error</p>}>
              <HairOrdersSuspense hairOrderId={hairOrderId} />
            </ErrorBoundary>
          </Suspense>
        </GridCol>
      </Grid>
    </Stack>
  );
};

function HairOrdersSuspense({ hairOrderId }: Props) {
  const utils = trpc.useUtils();
  const [hairOrder] = trpc.hairOrders.getById.useSuspenseQuery({
    id: hairOrderId,
  });
  const [notes] = trpc.hairOrderNotes.getNotesByHairOrderId.useSuspenseQuery({
    hairOrderId,
  });
  const [transactions] = trpc.transactions.getByHairOrderId.useSuspenseQuery({
    hairOrderId,
    includeCustomer: false,
  });
  const [customerOptions] = trpc.customers.getAll.useSuspenseQuery();

  const openNewHairOrderNoteDrawer = useHairOrderNoteDrawerStore(
    (state) => state.openDrawer,
  );

  const updateHairOrderMutation = trpc.hairOrders.update.useMutation({
    onSuccess: () => {
      utils.hairOrders.getById.invalidate({ id: hairOrderId });
      notifications.show({
        color: "green",
        title: "Success!",
        message: "Hair Order updated.",
      });
    },
    onError: () => {
      notifications.show({
        color: "red",
        title: "Failed!",
        message: "Something went wrong updating Hair Order.",
      });
    },
  });

  return (
    <Grid>
      <GridCol span={{ base: 12, lg: 3 }}>
        <Stack gap="lg">
          <Paper withBorder p="md" radius="md" shadow="sm">
            <Stack gap="sm">
              <Flex direction="column">
                <Text c="dimmed" size="xs">
                  Placed At:
                </Text>
                {hairOrder.placedAt ? (
                  <Text size="sm" w={500}>
                    {dayjs(hairOrder.placedAt).format("ddd MMM YYYY")}
                  </Text>
                ) : (
                  <DatePickerDrawer
                    date={hairOrder.placedAt}
                    onSelected={(date) =>
                      updateHairOrderMutation.mutate({
                        hairOrder: {
                          ...hairOrder,
                          placedAt: date,
                        },
                      })
                    }
                  />
                )}
              </Flex>
              <Flex direction="column">
                <Text c="dimmed" size="xs">
                  Arrived At:
                </Text>
                {hairOrder.arrivedAt ? (
                  <Text size="sm" w={500}>
                    {dayjs(hairOrder.arrivedAt).format("ddd MMM YYYY")}
                  </Text>
                ) : (
                  <DatePickerDrawer
                    date={hairOrder.arrivedAt}
                    onSelected={(date) =>
                      updateHairOrderMutation.mutate({
                        hairOrder: {
                          ...hairOrder,
                          arrivedAt: date,
                        },
                      })
                    }
                  />
                )}
              </Flex>
              <Flex direction="column">
                <Text c="dimmed" size="xs">
                  Created By:
                </Text>
                <Text size="sm" w={500}>
                  {hairOrder.createdBy.name}
                </Text>
              </Flex>
              <Flex direction="column">
                <Text c="dimmed" size="xs">
                  Total:
                </Text>
                <Text size="sm" w={500}>
                  £ 500
                </Text>
              </Flex>
              <Flex direction="column">
                <Text c="dimmed" size="xs">
                  Customer:
                </Text>
                <Text size="sm" w={500}>
                  {hairOrder.customer ? (
                    hairOrder.customer.name
                  ) : (
                    <CustomerPickerModal
                      customers={customerOptions}
                      onSubmit={(id) => {
                        updateHairOrderMutation.mutate({
                          hairOrder: {
                            ...hairOrder,
                            customerId: id as string,
                          },
                        });
                      }}
                      multiple={false}
                    />
                  )}
                </Text>
              </Flex>
            </Stack>
          </Paper>
        </Stack>
      </GridCol>
      <GridCol span={{ base: 12, lg: 9 }}>
        <Stack gap="sm">
          <Paper withBorder p="md" radius="md" shadow="sm">
            <Group justify="space-between" gap="sm">
              <Title order={4}>Notes</Title>
              <Button
                onClick={() =>
                  openNewHairOrderNoteDrawer({
                    hairOrderId,
                    onCreated: () => {
                      utils.hairOrderNotes.getNotesByHairOrderId.invalidate({
                        hairOrderId,
                      });
                    },
                  })
                }
              >
                New
              </Button>
            </Group>
            <HairOrderNotesTable hairOrderId={hairOrderId} notes={notes} />
          </Paper>
          <Paper withBorder p="md" radius="md" shadow="sm">
            <Group justify="space-between" gap="sm">
              <Title order={4}>Transactions</Title>
              <Button disabled={!hairOrder.customer}>New</Button>
            </Group>
            <TransactionsTable
              hairOrderId={hairOrderId}
              transactions={transactions}
            />
          </Paper>
          <Paper withBorder p="md" radius="md" shadow="sm">
            <Group justify="space-between" gap="sm">
              <Title order={4}>Hair</Title>
              <Button>New</Button>
            </Group>
            Table
          </Paper>
        </Stack>
      </GridCol>
    </Grid>
  );
}
