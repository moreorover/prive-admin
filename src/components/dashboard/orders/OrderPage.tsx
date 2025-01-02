"use client";

import {
  Badge,
  Button,
  Grid,
  GridCol,
  Paper,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { Customer, Order, OrderItem } from "@/lib/schemas";
import { PageContainer } from "@/components/page_container/PageContainer";
import { useSetAtom } from "jotai";
import {
  editOrderDrawerAtom,
  newOrderItemDrawerAtom,
  newTransactionDrawerAtom,
} from "@/lib/atoms";
import dayjs from "dayjs";
import OrderItemsTable from "@/components/dashboard/orders/OrderItemsTable";

interface Props {
  order: Order;
  orderTotal: number;
  customer: Customer;
  orderItems: {
    id: string;
    product: string;
    productVariant: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    orderItem: OrderItem;
  }[];
  productOptions: { value: string; label: string }[];
}

export default function OrderPage({
  order,
  orderTotal,
  customer,
  orderItems,
  productOptions,
}: Props) {
  const showEditOrderDrawer = useSetAtom(editOrderDrawerAtom);
  const showNewOrderItemDrawer = useSetAtom(newOrderItemDrawerAtom);
  const showNewTransactionDrawer = useSetAtom(newTransactionDrawerAtom);

  const productVariants = orderItems.flatMap((orderItem) => [
    orderItem.orderItem.productVariantId,
  ]);

  const newOrderItemProductOptions = productOptions.filter(
    (productOption) => !productVariants.includes(productOption.value),
  );

  const editOrderItemProductOptions = productOptions.filter((productOption) =>
    productVariants.includes(productOption.value),
  );

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
                <strong>Type:</strong>{" "}
                <Badge color={order.type == "SALE" ? "green" : "red"}>
                  {order.type}
                </Badge>
              </Text>
              <Text>
                <strong>Customer:</strong> {customer.name}
              </Text>
              <Text>
                <strong>Total:</strong>£ {orderTotal}
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
                    productOptions: newOrderItemProductOptions,
                  });
                }}
              >
                New
              </Button>
            </div>
            <OrderItemsTable
              orderItems={orderItems}
              productOptions={editOrderItemProductOptions}
            />
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
              <Title order={4}>Order Transaction</Title>
              <Button
                onClick={() => {
                  showNewTransactionDrawer({
                    isOpen: true,
                    orderId: order.id!,
                  });
                }}
              >
                New
              </Button>
            </div>
            table here
          </Paper>
        </GridCol>
      </Grid>
    </PageContainer>
  );
}
