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
              background: "var(--mantine-color-gray-light)",
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
      </Grid>
    </PageContainer>
  );
}
