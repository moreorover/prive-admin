"use client";

import { Button, Grid, GridCol, Paper, Title } from "@mantine/core";
import { Customer, Order } from "@/lib/schemas";
import { PageContainer } from "@/components/page_container/PageContainer";
import { useSetAtom } from "jotai";
import { editCustomerDrawerAtom, newOrderDrawerAtom } from "@/lib/atoms";
import SimpleOrdersTable from "@/components/dashboard/orders/SimpleOrdersTable";

interface Props {
  customer: Customer;
  orders: Order[];
}

export default function CustomerPage({ customer, orders }: Props) {
  const showEditCustomerDrawer = useSetAtom(editCustomerDrawerAtom);
  const showNewOrderDrawer = useSetAtom(newOrderDrawerAtom);
  return (
    <PageContainer title={customer.name}>
      <Grid>
        <GridCol span={{ sm: 12, md: 12, lg: 12 }}>
          <Paper
            style={{
              display: "flex",
              justifyContent: "flex-end",
              width: "100%",
            }}
          >
            <Button
              onClick={() => {
                showEditCustomerDrawer({ isOpen: true, customer });
              }}
            >
              Edit
            </Button>
          </Paper>
        </GridCol>
        <GridCol span={{ sm: 12, md: 12, lg: 12 }}>
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
              <Title order={4}>Orders</Title>
              <Button
                onClick={() => {
                  showNewOrderDrawer({
                    isOpen: true,
                    customerId: customer.id!,
                  });
                }}
              >
                New
              </Button>
            </div>
            <SimpleOrdersTable orders={orders} />
          </Paper>
        </GridCol>
      </Grid>
    </PageContainer>
  );
}
