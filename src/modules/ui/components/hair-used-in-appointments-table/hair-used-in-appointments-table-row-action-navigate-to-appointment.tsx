import { useHairUsedInAppointmentsTableRowContext } from "@/modules/ui/components/hair-used-in-appointments-table/hair-used-in-appointments-table-row-context";
import { Menu } from "@mantine/core";
import Link from "next/link";

export default function HairUsedInAppointmentsTableRowActionViewAppointment() {
	const { hair } = useHairUsedInAppointmentsTableRowContext();
	return (
		<Menu.Item
			component={Link}
			href={`/dashboard/appointments/${hair.appointmentId}`}
		>
			View Appointment
		</Menu.Item>
	);
}
