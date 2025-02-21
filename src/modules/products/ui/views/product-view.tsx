"use client";

import {
  Button,
  Grid,
  GridCol,
  Group,
  Paper,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useSetAtom } from "jotai";
import {
  editProductDrawerAtom,
  newProductVariantDrawerAtom,
} from "@/lib/atoms";
import { trpc } from "@/trpc/client";
import { Suspense } from "react";
import { LoaderSkeleton } from "@/components/loader-skeleton";
import { ErrorBoundary } from "react-error-boundary";
import { ProductVariantsTable } from "@/modules/products/ui/components/product-variants-table";

interface Props {
  productId: string;
}

export const ProductView = ({ productId }: Props) => {
  return (
    <Suspense fallback={<LoaderSkeleton />}>
      <ErrorBoundary fallback={<p>Error</p>}>
        <ProductSuspense productId={productId} />
      </ErrorBoundary>
    </Suspense>
  );
};

export const ProductSuspense = ({ productId }: Props) => {
  const utils = trpc.useUtils();
  const showEditProductDrawer = useSetAtom(editProductDrawerAtom);
  const showNewProductVariantDrawer = useSetAtom(newProductVariantDrawerAtom);
  const [product] = trpc.products.getOne.useSuspenseQuery({ id: productId });
  return (
    <Grid>
      {/* Header Section */}
      <GridCol span={12}>
        <Paper withBorder p="md" radius="md" shadow="sm">
          <Group justify="space-between">
            <Title order={4}>{product.name}</Title>
            <Button
              onClick={() =>
                showEditProductDrawer({
                  isOpen: true,
                  product,
                  onUpdated: () => {
                    utils.products.getOne.invalidate({ id: productId });
                  },
                })
              }
            >
              Edit
            </Button>
          </Group>
        </Paper>
      </GridCol>

      {/* Product Details Section */}
      <GridCol span={12}>
        <Paper withBorder p="md" radius="md" shadow="sm">
          <Stack gap="md">
            <Text>
              <strong>Description:</strong> {product.description}
            </Text>
          </Stack>
        </Paper>
      </GridCol>
      <GridCol span={{ sm: 12, md: 12, lg: 12 }}>
        <Paper withBorder p="md" radius="md" shadow="sm">
          <Group justify="space-between">
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
          </Group>
          {product.variants.length > 0 ? (
            <ProductVariantsTable productVariants={product.variants} />
          ) : (
            <Text c="gray">No Appointments found.</Text>
          )}
        </Paper>
      </GridCol>
    </Grid>
  );
};
