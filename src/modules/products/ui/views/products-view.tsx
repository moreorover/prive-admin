"use client";

import {
  Button,
  Grid,
  GridCol,
  Group,
  Paper,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { trpc } from "@/trpc/client";
import { Suspense, useState } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { LoaderSkeleton } from "@/components/loader-skeleton";
import { useSetAtom } from "jotai";
import { newProductDrawerAtom } from "@/lib/atoms";
import { ProductsTable } from "@/modules/products/ui/components/products-table";

export const ProductsView = () => {
  return (
    <Suspense fallback={<LoaderSkeleton />}>
      <ErrorBoundary fallback={<p>Error</p>}>
        <ProductsSuspense />
      </ErrorBoundary>
    </Suspense>
  );
};

function ProductsSuspense() {
  const utils = trpc.useUtils();
  const showNewProductDrawer = useSetAtom(newProductDrawerAtom);
  const [products] = trpc.products.getAll.useSuspenseQuery();

  const [searchTerm, setSearchTerm] = useState("");

  const filteredProducts = products.filter((product) => {
    const searchLower = searchTerm.toLowerCase();

    return (
      product.name.toLowerCase().includes(searchLower) ||
      product.description?.toLowerCase().includes(searchLower) ||
      product.id.toLowerCase() === searchLower
    );
  });

  return (
    <Grid>
      <GridCol span={12}>
        <Paper withBorder p="md" radius="md" shadow="sm">
          <Group justify="space-between">
            <Title order={4}>Products</Title>
            <Group>
              <TextInput
                placeholder="Search..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.currentTarget.value)}
              />
              <Button
                onClick={() => {
                  showNewProductDrawer({
                    isOpen: true,
                    onCreated: () => {
                      utils.products.getAll.invalidate();
                    },
                  });
                }}
              >
                New
              </Button>
            </Group>
          </Group>
        </Paper>
      </GridCol>
      <GridCol span={12}>
        <Paper withBorder p="md" radius="md" shadow="sm">
          {filteredProducts.length > 0 ? (
            <ProductsTable products={filteredProducts} />
          ) : (
            <Text c="gray">No products found.</Text>
          )}
        </Paper>
      </GridCol>
    </Grid>
  );
}
