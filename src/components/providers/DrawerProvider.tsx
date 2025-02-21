"use client";

import NewProductDrawer from "@/components/dashboard/products/NewProductDrawer";
import EditProductDrawer from "@/components/dashboard/products/EditProductDrawer";
import NewProductVariantDrawer from "@/components/dashboard/products/NewProductVariantDrawer";
import EditProductVariantDrawer from "@/components/dashboard/products/EditProductVariantDrawer";
import NewOrderItemDrawer from "@/components/dashboard/orders/NewOrderItemDrawer";
import EditOrderItemDrawer from "@/components/dashboard/orders/EditOrderItemDrawer";
import { NewTransactionDrawer } from "@/modules/transactions/ui/components/new-transaction-drawer";
import { NewAppointmentDrawer } from "@/modules/appointments/ui/components/new-appointment-drawer";
import { EditAppointmentDrawer } from "@/modules/appointments/ui/components/edit-appointment-drawer";
import { NewCustomerDrawer } from "@/modules/customers/ui/components/new-customer-drawer";
import { EditCustomerDrawer } from "@/modules/customers/ui/components/edit-customer-drawer";
import { NewOrderDrawer } from "@/modules/orders/ui/components/new-order-drawer";
import { EditOrderDrawer } from "@/modules/orders/ui/components/edit-order-drawer";

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

      <NewOrderItemDrawer />
      <EditOrderItemDrawer />

      <NewTransactionDrawer />

      <NewAppointmentDrawer />
      <EditAppointmentDrawer />
    </>
  );
}
