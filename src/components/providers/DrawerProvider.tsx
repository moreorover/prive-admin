"use client";

import {NewTransactionDrawer} from "@/modules/transactions/ui/components/new-transaction-drawer";
import {NewAppointmentDrawer} from "@/modules/appointments/ui/components/new-appointment-drawer";
import {EditAppointmentDrawer} from "@/modules/appointments/ui/components/edit-appointment-drawer";
import {NewCustomerDrawer} from "@/modules/customers/ui/components/new-customer-drawer";
import {EditCustomerDrawer} from "@/modules/customers/ui/components/edit-customer-drawer";
import {NewOrderDrawer} from "@/modules/orders/ui/components/new-order-drawer";
import {EditOrderDrawer} from "@/modules/orders/ui/components/edit-order-drawer";
import {NewProductDrawer} from "@/modules/products/ui/components/new-product-drawer";
import {EditProductDrawer} from "@/modules/products/ui/components/edit-product-drawer";
import {NewProductVariantDrawer} from "@/modules/product_variants/ui/components/new-product-variant-drawer";
import {EditProductVariantDrawer} from "@/modules/product_variants/ui/components/edit-product-variant-drawer";
import {NewOrderItemDrawer} from "@/modules/order_item/ui/components/new-order-item-drawer";
import {EditOrderItemDrawer} from "@/modules/order_item/ui/components/edit-order-item-drawer";
import {EditTransactionDrawer} from "@/modules/transactions/ui/components/edit-transaction-drawer";
import {NewAppointmentNoteDrawer} from "@/modules/appointment_notes/ui/components/new-appointment-note-drawer";
import {EditAppointmentNoteDrawer} from "@/modules/appointment_notes/ui/components/edit-appointment-note-drawer";
import {NewHairOrderNoteDrawer} from "@/modules/hair_order_notes/ui/components/new-hair-order-note-drawer";
import {EditHairOrderNoteDrawer} from "@/modules/hair_order_notes/ui/components/edit-appointment-note-drawer";

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
      <EditTransactionDrawer />

      <NewAppointmentDrawer />
      <EditAppointmentDrawer />

      <NewAppointmentNoteDrawer />
      <EditAppointmentNoteDrawer />

      <NewHairOrderNoteDrawer />
      <EditHairOrderNoteDrawer />
    </>
  );
}
