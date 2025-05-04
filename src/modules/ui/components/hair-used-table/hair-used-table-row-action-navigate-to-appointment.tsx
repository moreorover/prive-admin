import { useHairUsedTableRowContext } from "@/modules/ui/components/hair-used-table/hair-used-table-row-context";
import { Menu } from "@mantine/core";
import Link from "next/link";

export default function HairUsedTableRowActionViewAppointment() {
	const { hair } = useHairUsedTableRowContext();

	if (!hair.appointmentId) return null;

	return (
		<Menu.Item
			component={Link}
			href={`/dashboard/appointments/${hair.appointmentId}`}
			disabled={!hair.appointmentId}
		>
			View Appointment
		</Menu.Item>
	);
}
