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
import { editOrderDrawerAtom, newTransactionDrawerAtom } from "@/lib/atoms";
import dayjs from "dayjs";
import { trpc } from "@/trpc/client";
import TransactionsTable from "@/modules/orders/ui/components/transactions-table";

interface Props {
  orderId: string;
}

export const OrderView = ({ orderId }: Props) => {
  const showEditOrderDrawer = useSetAtom(editOrderDrawerAtom);
  // const showNewOrderItemDrawer = useSetAtom(newOrderItemDrawerAtom);
  const showNewTransactionDrawer = useSetAtom(newTransactionDrawerAtom);
  const utils = trpc.useUtils();
  const [order] = trpc.orders.getOne.useSuspenseQuery({ id: orderId });
  const [transactions] = trpc.transactions.getByOrderId.useSuspenseQuery({
    orderId,
    includeCustomer: true,
  });

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
            // onClick={() => {
            //   showNewOrderItemDrawer({
            //     isOpen: true,
            //     orderId: order.id!,
            //     productOptions: newOrderItemProductOptions,
            //   });
            // }}
            >
              New
            </Button>
          </Group>
          {/*<OrderItemsTable*/}
          {/*  orderItems={orderItems}*/}
          {/*  productOptions={editOrderItemProductOptions}*/}
          {/*/>*/}
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
              // onClick={() => {
              //   showPickTransactionModal({
              //     isOpen: true,
              //     transactions: transactionOptions,
              //     onConfirmAction: onConfirmAction,
              //   });
              // }}
              >
                Pick transactions
              </Button>
            </Group>
          </Group>
          <TransactionsTable
            transactions={transactions}
            onUpdateAction={() => {
              utils.transactions.getByOrderId.invalidate({
                orderId,
                includeCustomer: true,
              });
            }}
          />
        </Paper>
      </GridCol>
    </Grid>
  );
};
