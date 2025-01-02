"use client";

import { Button, Grid, GridCol, Paper } from "@mantine/core";
import { Customer, Order } from "@/lib/schemas";
import { PageContainer } from "@/components/page_container/PageContainer";
import FullOrdersTable from "@/components/dashboard/orders/FullOrdersTable";

interface Props {
  orders: (Order & { customer: Customer; total: number })[];
}

export default function OrdersPage({ orders }: Props) {
  // const showNewOrderDrawer = useSetAtom(newOrderDrawerAtom);

  return (
    <PageContainer title="Orders">
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
              disabled
              // onClick={() => {
              //   showNewOrderDrawer({ isOpen: true });
              // }}
            >
              New
            </Button>
          </Paper>
        </GridCol>
        <GridCol span={{ sm: 12, md: 12, lg: 12 }}>
          <FullOrdersTable orders={orders} />
        </GridCol>
      </Grid>
    </PageContainer>
  );
}
