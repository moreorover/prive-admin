"use client";

import NewCustomerDrawer from "@/components/dashboard/customers/NewCustomerDrawer";
import EditCustomerDrawer from "@/components/dashboard/customers/EditCustomerDrawer";
import NewProductDrawer from "@/components/dashboard/products/NewProductDrawer";
import EditProductDrawer from "@/components/dashboard/products/EditProductDrawer";
import NewProductVariantDrawer from "@/components/dashboard/products/NewProductVariantDrawer";
import EditProductVariantDrawer from "@/components/dashboard/products/EditProductVariantDrawer";
import NewOrderDrawer from "@/components/dashboard/orders/NewOrderDrawer";
import EditOrderDrawer from "@/components/dashboard/orders/EditOrderDrawer";
import NewOrderItemDrawer from "@/components/dashboard/orders/NewOrderItemDrawer";
import EditOrderItemDrawer from "@/components/dashboard/orders/EditOrderItemDrawer";
import NewTransactionDrawer from "@/components/dashboard/transactions/NewTransactionDrawer";
import NewAppointmentDrawer from "@/components/dashboard/appointments/NewAppointmentDrawer";
import EditAppointmentDrawer from "@/components/dashboard/appointments/EditAppointmentDrawer";
import TransactionPickerModal from "@/components/dashboard/transactions/TransactionPickerModal";
import PersonnelPickerModal from "@/components/dashboard/customers/PersonnelPickerModal";

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

      <TransactionPickerModal />

      <PersonnelPickerModal />
    </>
  );
}
