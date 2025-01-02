"use client";

import { Button, Grid, GridCol, Paper } from "@mantine/core";
import { Product } from "@/lib/schemas";
import { PageContainer } from "@/components/page_container/PageContainer";
import ProductsTable from "@/components/dashboard/products/ProductsTable";
import { useSetAtom } from "jotai";
import { newProductDrawerAtom } from "@/lib/atoms";

interface Props {
  products: Product[];
}

export default function ProductsPage({ products }: Props) {
  const showNewProductDrawer = useSetAtom(newProductDrawerAtom);

  return (
    <PageContainer title="Products">
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
                showNewProductDrawer({ isOpen: true });
              }}
            >
              New
            </Button>
          </Paper>
        </GridCol>
        <GridCol span={{ sm: 12, md: 12, lg: 12 }}>
          <ProductsTable products={products} />
        </GridCol>
      </Grid>
    </PageContainer>
  );
}
