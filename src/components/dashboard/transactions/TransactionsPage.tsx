"use client";

import { Button, Grid, GridCol, Paper } from "@mantine/core";
import { Transaction } from "@/lib/schemas";
import { PageContainer } from "@/components/page_container/PageContainer";
import TransactionsTable from "@/components/dashboard/transactions/TransactionsTable";
import { MonzoUpload } from "@/components/dashboard/transactions/MonzoUpload";
import { useSetAtom } from "jotai";
import { newTransactionDrawerAtom } from "@/lib/atoms";

interface Props {
  transactions: Transaction[];
}

export default function TransactionsPage({ transactions }: Props) {
  const showNewTransactionDrawer = useSetAtom(newTransactionDrawerAtom);

  return (
    <PageContainer title="Transactions">
      <Grid>
        <GridCol span={{ sm: 12, md: 12, lg: 12 }}>
          <Paper
            style={{
              display: "flex",
              justifyContent: "flex-end",
              width: "100%",
              gap: "10px",
            }}
          >
            <Button
              onClick={() => {
                showNewTransactionDrawer({ isOpen: true });
              }}
            >
              New
            </Button>
            <MonzoUpload />
          </Paper>
        </GridCol>
        <GridCol span={{ sm: 12, md: 12, lg: 12 }}>
          <TransactionsTable transactions={transactions} />
        </GridCol>
      </Grid>
    </PageContainer>
  );
}
