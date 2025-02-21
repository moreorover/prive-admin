"use client";

import NewProductDrawer from "@/components/dashboard/products/NewProductDrawer";
import EditProductDrawer from "@/components/dashboard/products/EditProductDrawer";
import NewProductVariantDrawer from "@/components/dashboard/products/NewProductVariantDrawer";
import EditProductVariantDrawer from "@/components/dashboard/products/EditProductVariantDrawer";
import NewOrderDrawer from "@/components/dashboard/orders/NewOrderDrawer";
import EditOrderDrawer from "@/components/dashboard/orders/EditOrderDrawer";
import NewOrderItemDrawer from "@/components/dashboard/orders/NewOrderItemDrawer";
import EditOrderItemDrawer from "@/components/dashboard/orders/EditOrderItemDrawer";
import { NewTransactionDrawer } from "@/modules/transactions/ui/components/new-transaction-drawer";
import { NewAppointmentDrawer } from "@/modules/appointments/ui/components/new-appointment-drawer";
import { EditAppointmentDrawer } from "@/modules/appointments/ui/components/edit-appointment-drawer";
import { NewCustomerDrawer } from "@/modules/customers/ui/components/new-customer-drawer";
import { EditCustomerDrawer } from "@/modules/customers/ui/components/edit-customer-drawer";

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
