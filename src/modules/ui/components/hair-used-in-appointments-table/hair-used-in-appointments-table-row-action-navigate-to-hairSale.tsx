import { useHairUsedInAppointmentsTableRowContext } from "@/modules/ui/components/hair-used-in-appointments-table/hair-used-in-appointments-table-row-context";
import { Menu } from "@mantine/core";
import Link from "next/link";

export default function HairUsedInAppointmentsTableRowActionViewHairSale() {
	const { hair } = useHairUsedInAppointmentsTableRowContext();

	if (!hair.hairSaleId) return null;

	return (
		<Menu.Item
			component={Link}
			href={`/dashboard/hair-sales/${hair.hairSaleId}`}
			disabled={!hair.hairSaleId}
		>
			View Hair Sale
		</Menu.Item>
	);
}
