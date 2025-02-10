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
import { Customer, Order, OrderItem, Transaction } from "@/lib/schemas";
import { PageContainer } from "@/components/page_container/PageContainer";
import { useSetAtom } from "jotai";
import {
  editOrderDrawerAtom,
  newOrderItemDrawerAtom,
  newTransactionDrawerAtom,
  transactionPickerModalAtom,
} from "@/lib/atoms";
import dayjs from "dayjs";
import OrderItemsTable from "@/components/dashboard/orders/OrderItemsTable";
import TransactionsTable from "@/components/dashboard/transactions/TransactionsTable";
import TransactionPickerModal from "@/components/dashboard/transactions/TransactionPickerModal";

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
  transactions: Transaction[];
}

export default function OrderPage({
  order,
  orderTotal,
  customer,
  orderItems,
  productOptions,
  transactions,
}: Props) {
  const showEditOrderDrawer = useSetAtom(editOrderDrawerAtom);
  const showNewOrderItemDrawer = useSetAtom(newOrderItemDrawerAtom);
  const showNewTransactionDrawer = useSetAtom(newTransactionDrawerAtom);
  const showPickTransactionModal = useSetAtom(transactionPickerModalAtom);

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
              <div>
                <strong>Type:</strong>{" "}
                <Badge color={order.type === "SALE" ? "green" : "red"}>
                  {order.type}
                </Badge>
              </div>
              <Text>
                <strong>Customer:</strong> {customer.name}
              </Text>
              <Text>
                <strong>Total:</strong> £ {orderTotal}
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
              <Title order={4}>Order Transactions</Title>
              <Group gap="sm">
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
                <Button
                  onClick={() => {
                    showPickTransactionModal({
                      isOpen: true,
                    });
                  }}
                >
                  Pick transactions
                </Button>
              </Group>
            </div>
            <TransactionsTable transactions={transactions} />
          </Paper>
        </GridCol>
      </Grid>
      <TransactionPickerModal
        transactions={transactions}
        onConfirm={() => {}}
      />
    </PageContainer>
  );
}
