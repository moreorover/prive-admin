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
import { editOrderDrawerAtom } from "@/lib/atoms";
import dayjs from "dayjs";

interface Props {
  order: Order;
  customer: Customer;
}

export default function OrderPage({ order, customer }: Props) {
  const showEditOrderDrawer = useSetAtom(editOrderDrawerAtom);
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
      </Grid>
    </PageContainer>
  );
}
