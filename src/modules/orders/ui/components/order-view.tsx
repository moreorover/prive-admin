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
import { editOrderDrawerAtom } from "@/lib/atoms";
import dayjs from "dayjs";
import { trpc } from "@/trpc/client";

interface Props {
  orderId: string;
}

export const OrderView = ({ orderId }: Props) => {
  const showEditOrderDrawer = useSetAtom(editOrderDrawerAtom);
  // const showNewOrderItemDrawer = useSetAtom(newOrderItemDrawerAtom);
  const utils = trpc.useUtils();
  const [order] = trpc.orders.getOne.useSuspenseQuery({ id: orderId });

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
      {/*<GridCol span={12}>*/}
      {/*  <Paper*/}
      {/*    style={{*/}
      {/*      padding: "16px",*/}
      {/*      borderRadius: "8px",*/}
      {/*    }}*/}
      {/*  >*/}
      {/*    <div*/}
      {/*      style={{*/}
      {/*        display: "flex",*/}
      {/*        justifyContent: "space-between",*/}
      {/*        alignItems: "center",*/}
      {/*        marginBottom: "16px",*/}
      {/*      }}*/}
      {/*    >*/}
      {/*      <Title order={4}>Order Transactions</Title>*/}
      {/*      <Group gap="sm">*/}
      {/*        <Button*/}
      {/*          onClick={() => {*/}
      {/*            showNewTransactionDrawer({*/}
      {/*              isOpen: true,*/}
      {/*              orderId: order.id!,*/}
      {/*            });*/}
      {/*          }}*/}
      {/*        >*/}
      {/*          New*/}
      {/*        </Button>*/}
      {/*        <Button*/}
      {/*          onClick={() => {*/}
      {/*            showPickTransactionModal({*/}
      {/*              isOpen: true,*/}
      {/*              transactions: transactionOptions,*/}
      {/*              onConfirmAction: onConfirmAction,*/}
      {/*            });*/}
      {/*          }}*/}
      {/*        >*/}
      {/*          Pick transactions*/}
      {/*        </Button>*/}
      {/*      </Group>*/}
      {/*    </div>*/}
      {/*    <TransactionsTable transactions={transactions} />*/}
      {/*  </Paper>*/}
      {/*</GridCol>*/}
    </Grid>
  );
};
