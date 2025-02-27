"use client";

import {
  Badge,
  Button,
  Grid,
  GridCol,
  Group,
  Paper,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useSetAtom } from "jotai";
import {
  editOrderDrawerAtom,
  newOrderItemDrawerAtom,
  newTransactionDrawerAtom,
} from "@/lib/atoms";
import dayjs from "dayjs";
import { trpc } from "@/trpc/client";
import TransactionsTable from "@/modules/orders/ui/components/transactions-table";
import { OrderItemsTable } from "@/modules/order_item/ui/components/order-items-table";
import { modals } from "@mantine/modals";

interface Props {
  orderId: string;
}

export const OrderView = ({ orderId }: Props) => {
  const showEditOrderDrawer = useSetAtom(editOrderDrawerAtom);
  const showNewOrderItemDrawer = useSetAtom(newOrderItemDrawerAtom);
  const showNewTransactionDrawer = useSetAtom(newTransactionDrawerAtom);
  const utils = trpc.useUtils();
  const [order] = trpc.orders.getOne.useSuspenseQuery({ id: orderId });
  const [transactionAllocations] =
    trpc.transactionAllocations.getByAppointmentAndOrderId.useSuspenseQuery({
      orderId,
      includeCustomer: true,
    });
  const [orderItems] = trpc.orderItems.getByOrderId.useSuspenseQuery({
    orderId,
  });
  const [orderItemOptions] =
    trpc.orderItems.getProductOptionsByOrderId.useSuspenseQuery({ orderId });

  const [transactionOptions] =
    trpc.transactions.getTransactionOptions.useSuspenseQuery();

  return (
    <Grid>
      {/* Header Section */}
      <GridCol span={12}>
        <Paper withBorder p="md" radius="md" shadow="sm">
          <Group justify="space-between">
            <Title order={2}>
              {dayjs(order.placedAt).format("DD MMM YYYY")}
            </Title>

            <Button
              onClick={() =>
                showEditOrderDrawer({
                  isOpen: true,
                  order,
                  onUpdated: () => {
                    utils.orders.getOne.invalidate({ id: orderId });
                  },
                })
              }
            >
              Edit
            </Button>
          </Group>
        </Paper>
      </GridCol>

      {/* Order Details Section */}
      <GridCol span={12}>
        <Paper withBorder p="md" radius="md" shadow="sm">
          <Stack gap="md">
            <Text>
              <strong>Status:</strong> {order.status}
            </Text>
            <div>
              <strong>Type:</strong>{" "}
              <Badge color={order.type === "SALE" ? "green" : "red"}>
                {order.type}
              </Badge>
            </div>
            <Text>
              <strong>Customer:</strong> {order.customer.name}
            </Text>
            <Text>
              <strong>Total:</strong> £ ---
            </Text>
          </Stack>
        </Paper>
      </GridCol>
      <GridCol span={12}>
        <Paper withBorder p="md" radius="md" shadow="sm">
          <Group justify="space-between">
            <Title order={4}>Order Items</Title>
            <Button
              onClick={() => {
                showNewOrderItemDrawer({
                  isOpen: true,
                  orderId: order.id!,
                  productOptions: orderItemOptions,
                  onCreated: () => {
                    utils.orders.getOne.invalidate({ id: orderId });
                    utils.orderItems.getByOrderId.invalidate({
                      orderId,
                    });
                    utils.orderItems.getProductOptionsByOrderId.invalidate({
                      orderId,
                    });
                  },
                });
              }}
            >
              New
            </Button>
          </Group>
          <OrderItemsTable
            orderItems={orderItems}
            productOptions={[]}
            onUpdatedAction={() => {
              utils.orderItems.getByOrderId.invalidate({
                orderId,
              });
            }}
          />
        </Paper>
      </GridCol>
      <GridCol span={12}>
        <Paper withBorder p="md" radius="md" shadow="sm">
          <Group justify="space-between">
            <Title order={4}>Order Transactions</Title>
            <Group gap="sm">
              <Button
                onClick={() => {
                  showNewTransactionDrawer({
                    isOpen: true,
                    orderId: orderId,
                    customerId: order.customer.id,
                    onCreated: () => {
                      utils.transactions.getByOrderId.invalidate({
                        orderId,
                        includeCustomer: true,
                      });
                    },
                  });
                }}
              >
                New
              </Button>
              <Button
                onClick={() =>
                  modals.openContextModal({
                    modal: "transactionPickerModal",
                    title: "Pick transactions",
                    size: "xl",
                    innerProps: {
                      customerId: order.customerId,
                      orderId,
                      transactionOptions,
                      onPicked: () => {
                        utils.transactions.getByOrderId.invalidate({
                          orderId,
                          includeCustomer: true,
                        });
                        utils.transactions.getTransactionOptions.invalidate();
                      },
                    },
                  })
                }
              >
                Pick transactions
              </Button>
            </Group>
          </Group>
          <TransactionsTable
            orderId={orderId}
            transactionAllocations={transactionAllocations}
          />
        </Paper>
      </GridCol>
    </Grid>
  );
};
