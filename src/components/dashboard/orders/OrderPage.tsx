"use client";

import {
  Button,
  Grid,
  GridCol,
  Paper,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { Customer, Order } from "@/lib/schemas";
import { PageContainer } from "@/components/page_container/PageContainer";
import { useSetAtom } from "jotai";
import { editOrderDrawerAtom, newOrderItemDrawerAtom } from "@/lib/atoms";
import dayjs from "dayjs";
import OrderItemsTable from "@/components/dashboard/orders/OrderItemsTable";

interface Props {
  order: Order;
  customer: Customer;
  orderItems: {
    id: string;
    product: string;
    productVariant: string;
    quantity: number;
    totalPrice: number;
  }[];
  productOptions: { value: string; label: string }[];
}

export default function OrderPage({
  order,
  customer,
  orderItems,
  productOptions,
}: Props) {
  const showEditOrderDrawer = useSetAtom(editOrderDrawerAtom);
  const showNewOrderItemDrawer = useSetAtom(newOrderItemDrawerAtom);
  return (
    <PageContainer title="Order Details">
      <Grid>
        {/* Header Section */}
        <GridCol span={12}>
          <Paper
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "16px",
              borderRadius: "8px",
            }}
          >
            <Title order={2}>
              {dayjs(order.placedAt).format("DD MMM YYYY")}
            </Title>
            <Button
              onClick={() => showEditOrderDrawer({ isOpen: true, order })}
            >
              Edit Order
            </Button>
          </Paper>
        </GridCol>

        {/* Order Details Section */}
        <GridCol span={12}>
          <Paper
            style={{
              padding: "16px",
              borderRadius: "8px",
            }}
          >
            <Stack gap="md">
              <Text>
                <strong>Status:</strong> {order.status}
              </Text>
              <Text>
                <strong>Customer:</strong> {customer.name}
              </Text>
            </Stack>
          </Paper>
        </GridCol>
        <GridCol span={12}>
          <Paper
            style={{
              padding: "16px",
              borderRadius: "8px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <Title order={4}>Order Items</Title>
              <Button
                onClick={() => {
                  showNewOrderItemDrawer({
                    isOpen: true,
                    orderId: order.id!,
                    productOptions: productOptions,
                  });
                }}
              >
                New
              </Button>
            </div>
            <OrderItemsTable orderItems={orderItems} />
          </Paper>
        </GridCol>
      </Grid>
    </PageContainer>
  );
}