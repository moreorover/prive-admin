"use client";

import NewCustomerDrawer from "@/components/dashboard/customers/NewCustomerDrawer";
import EditCustomerDrawer from "@/components/dashboard/customers/EditCustomerDrawer";
import NewProductDrawer from "@/components/dashboard/products/NewProductDrawer";
import EditProductDrawer from "@/components/dashboard/products/EditProductDrawer";
import NewProductVariantDrawer from "@/components/dashboard/products/NewProductVariantDrawer";
import EditProductVariantDrawer from "@/components/dashboard/products/EditProductVariantDrawer";
import NewOrderDrawer from "@/components/dashboard/orders/NewOrderDrawer";
import EditOrderDrawer from "@/components/dashboard/orders/EditOrderDrawer";

export default function DrawerProvider() {
  return (
    <>
      <NewCustomerDrawer />
      <EditCustomerDrawer />

      <NewProductDrawer />
      <EditProductDrawer />

      <NewProductVariantDrawer />
      <EditProductVariantDrawer />

      <NewOrderDrawer />
      <EditOrderDrawer />
    </>
  );
}
