"use client";

import { Button, Grid, GridCol, Paper } from "@mantine/core";
import { Product } from "@/lib/schemas";
import { PageContainer } from "@/components/page_container/PageContainer";
import { useSetAtom } from "jotai";
import { editProductDrawerAtom } from "@/lib/atoms";

interface Props {
  product: Product;
}

export default function ProductPage({ product }: Props) {
  const showEditProductDrawer = useSetAtom(editProductDrawerAtom);

  return (
    <PageContainer title={product.name}>
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
                showEditProductDrawer({ isOpen: true, product });
              }}
            >
              Edit
            </Button>
          </Paper>
        </GridCol>
        <GridCol span={{ sm: 12, md: 12, lg: 12 }}>
          {/*<ProductsTable products={products} />*/}
        </GridCol>
      </Grid>
    </PageContainer>
  );
}
