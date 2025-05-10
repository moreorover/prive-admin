"use client";

import { DeleteAppointmentNoteDrawer } from "@/modules/appointment_notes/ui/components/delete-appointmentNote-drawer";
import { EditAppointmentNoteDrawer } from "@/modules/appointment_notes/ui/components/edit-appointment-note-drawer";
import { NewAppointmentNoteDrawer } from "@/modules/appointment_notes/ui/components/new-appointment-note-drawer";
import { EditAppointmentDrawer } from "@/modules/appointments/ui/components/edit-appointment-drawer";
import { NewAppointmentDrawer } from "@/modules/appointments/ui/components/new-appointment-drawer";
import { EditCustomerDrawer } from "@/modules/customers/ui/components/edit-customer-drawer";
import { NewCustomerDrawer } from "@/modules/customers/ui/components/new-customer-drawer";
import { DeleteHairAssignedDrawer } from "@/modules/hair-assigned/ui/components/delete-hairAssigned-drawer";
import { EditHairAssignedDrawer } from "@/modules/hair-assigned/ui/components/edit-hairAssigned-drawer";
import { NewHairAssignedDrawer } from "@/modules/hair-assigned/ui/components/new-hairAssigned-drawer";
import { DeleteHairOrderNoteDrawer } from "@/modules/hair_order_notes/ui/components/delete-hairOrderNote-drawer";
import { EditHairOrderNoteDrawer } from "@/modules/hair_order_notes/ui/components/edit-appointment-note-drawer";
import { NewHairOrderNoteDrawer } from "@/modules/hair_order_notes/ui/components/new-hair-order-note-drawer";
import { EditHairOrderDrawer } from "@/modules/hair_orders/ui/components/edit-hairOrder-drawer";
import { DeleteTransactionDrawer } from "@/modules/transactions/ui/components/delete-transaction-drawer";
import { EditTransactionDrawer } from "@/modules/transactions/ui/components/edit-transaction-drawer";
import { NewTransactionDrawer } from "@/modules/transactions/ui/components/new-transaction-drawer";

export default function DrawerProvider() {
	return (
		<>
			<NewCustomerDrawer />
			<EditCustomerDrawer />

			<NewTransactionDrawer />
			<EditTransactionDrawer />
			<DeleteTransactionDrawer />

			<NewAppointmentDrawer />
			<EditAppointmentDrawer />

			<NewAppointmentNoteDrawer />
			<EditAppointmentNoteDrawer />
			<DeleteAppointmentNoteDrawer />

			<NewHairOrderNoteDrawer />
			<EditHairOrderNoteDrawer />
			<DeleteHairOrderNoteDrawer />

			<EditHairOrderDrawer />

			<NewHairAssignedDrawer />
			<EditHairAssignedDrawer />
			<DeleteHairAssignedDrawer />
		</>
	);
}
