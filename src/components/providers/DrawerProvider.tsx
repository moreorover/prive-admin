"use client";

import { EditAppointmentDrawer } from "@/modules/appointments/ui/components/edit-appointment-drawer";
import { NewAppointmentDrawer } from "@/modules/appointments/ui/components/new-appointment-drawer";
import { EditCustomerDrawer } from "@/modules/customers/ui/components/edit-customer-drawer";
import { NewCustomerDrawer } from "@/modules/customers/ui/components/new-customer-drawer";
import { DeleteHairAssignedDrawer } from "@/modules/hair-assigned/ui/components/delete-hairAssigned-drawer";
import { EditHairAssignedDrawer } from "@/modules/hair-assigned/ui/components/edit-hairAssigned-drawer";
import { NewHairAssignedDrawer } from "@/modules/hair-assigned/ui/components/new-hairAssigned-drawer";
import { EditHairOrderDrawer } from "@/modules/hair_orders/ui/components/edit-hairOrder-drawer";
import { NewHairOrderDrawer } from "@/modules/hair_orders/ui/components/new-hairOrder-drawer";
import { DeleteNoteDrawer } from "@/modules/notes/ui/components/delete-note-drawer";
import { EditNoteDrawer } from "@/modules/notes/ui/components/edit-note-drawer";
import { NewNoteDrawer } from "@/modules/notes/ui/components/new-note-drawer";
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

			<NewHairOrderDrawer />
			<EditHairOrderDrawer />

			<NewHairAssignedDrawer />
			<EditHairAssignedDrawer />
			<DeleteHairAssignedDrawer />

			<NewNoteDrawer />
			<EditNoteDrawer />
			<DeleteNoteDrawer />
		</>
	);
}
