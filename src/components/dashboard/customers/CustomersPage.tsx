"use client";

import { Button, Grid, GridCol, Paper } from "@mantine/core";
import { Customer } from "@/lib/schemas";
import { PageContainer } from "@/components/page_container/PageContainer";
import CustomersTable from "@/components/dashboard/customers/CustomersTable";
import { useSetAtom } from "jotai";
import { newCustomerDrawerAtom } from "@/lib/atoms";

interface Props {
  customers: Customer[];
}

export default function CustomersPage({ customers }: Props) {
  const showNewCustomerDrawer = useSetAtom(newCustomerDrawerAtom);

  return (
    <PageContainer title="Customers">
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
                showNewCustomerDrawer({ isOpen: true });
              }}
            >
              New
            </Button>
          </Paper>
        </GridCol>
        <GridCol span={{ sm: 12, md: 12, lg: 12 }}>
          <CustomersTable customers={customers} />
        </GridCol>
      </Grid>
    </PageContainer>
  );
}
