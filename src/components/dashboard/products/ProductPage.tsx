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
import { Product, ProductVariant } from "@/lib/schemas";
import { PageContainer } from "@/components/page_container/PageContainer";
import { useSetAtom } from "jotai";
import {
  editProductDrawerAtom,
  newProductVariantDrawerAtom,
} from "@/lib/atoms";
import ProductVariantsTable from "@/components/dashboard/products/ProductVariantsTable";

interface Props {
  product: Product;
  productVariants: ProductVariant[];
}

export default function ProductPage({ product, productVariants }: Props) {
  const showEditProductDrawer = useSetAtom(editProductDrawerAtom);
  const showNewProductVariantDrawer = useSetAtom(newProductVariantDrawerAtom);
  return (
    <PageContainer title="Product Details">
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
            <Title order={2}>{product.name}</Title>
            <Button
              onClick={() => showEditProductDrawer({ isOpen: true, product })}
            >
              Edit Product
            </Button>
          </Paper>
        </GridCol>

        {/* Product Details Section */}
        <GridCol span={12}>
          <Paper
            style={{
              padding: "16px",
              borderRadius: "8px",
            }}
          >
            <Stack gap="md">
              <Text>
                <strong>Description:</strong> {product.description}
              </Text>
            </Stack>
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
              <Title order={4}>Product Variants</Title>
              <Button
                onClick={() => {
                  showNewProductVariantDrawer({
                    isOpen: true,
                    productId: product.id!,
                  });
                }}
              >
                New
              </Button>
            </div>
            <ProductVariantsTable productVariants={productVariants} />
          </Paper>
        </GridCol>
      </Grid>
    </PageContainer>
  );
}
