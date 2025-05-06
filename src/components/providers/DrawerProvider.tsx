"use client";

import { EditAppointmentNoteDrawer } from "@/modules/appointment_notes/ui/components/edit-appointment-note-drawer";
import { NewAppointmentNoteDrawer } from "@/modules/appointment_notes/ui/components/new-appointment-note-drawer";
import { DeleteHairAssignmentToAppointmentDrawer } from "@/modules/appointments/ui/components/delete-hair-assignment-drawer";
import { EditAppointmentDrawer } from "@/modules/appointments/ui/components/edit-appointment-drawer";
import { EditHairAssignmentToAppointmentDrawer } from "@/modules/appointments/ui/components/edit-hair-assignment-drawer";
import { NewAppointmentDrawer } from "@/modules/appointments/ui/components/new-appointment-drawer";
import { EditCustomerDrawer } from "@/modules/customers/ui/components/edit-customer-drawer";
import { NewCustomerDrawer } from "@/modules/customers/ui/components/new-customer-drawer";
import { EditHairAssignmentToSaleDrawer } from "@/modules/hair-sales/ui/components/edit-hair-assignment-drawer";
import { EditHairOrderNoteDrawer } from "@/modules/hair_order_notes/ui/components/edit-appointment-note-drawer";
import { NewHairOrderNoteDrawer } from "@/modules/hair_order_notes/ui/components/new-hair-order-note-drawer";
import { EditOrderItemDrawer } from "@/modules/order_item/ui/components/edit-order-item-drawer";
import { NewOrderItemDrawer } from "@/modules/order_item/ui/components/new-order-item-drawer";
import { EditOrderDrawer } from "@/modules/orders/ui/components/edit-order-drawer";
import { NewOrderDrawer } from "@/modules/orders/ui/components/new-order-drawer";
import { EditProductVariantDrawer } from "@/modules/product_variants/ui/components/edit-product-variant-drawer";
import { NewProductVariantDrawer } from "@/modules/product_variants/ui/components/new-product-variant-drawer";
import { EditProductDrawer } from "@/modules/products/ui/components/edit-product-drawer";
import { NewProductDrawer } from "@/modules/products/ui/components/new-product-drawer";
import { DeleteTransactionDrawer } from "@/modules/transactions/ui/components/delete-transaction-drawer";
import { EditTransactionDrawer } from "@/modules/transactions/ui/components/edit-transaction-drawer";
import { NewTransactionDrawer } from "@/modules/transactions/ui/components/new-transaction-drawer";

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
			<DeleteTransactionDrawer />

			<NewAppointmentDrawer />
			<EditAppointmentDrawer />

			<NewAppointmentNoteDrawer />
			<EditAppointmentNoteDrawer />

			<NewHairOrderNoteDrawer />
			<EditHairOrderNoteDrawer />

			<EditHairAssignmentToAppointmentDrawer />
			<DeleteHairAssignmentToAppointmentDrawer />
			<EditHairAssignmentToSaleDrawer />
		</>
	);
}
