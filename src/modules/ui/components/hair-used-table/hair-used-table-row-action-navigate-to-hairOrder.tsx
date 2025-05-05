import { useHairUsedTableRowContext } from "@/modules/ui/components/hair-used-table/hair-used-table-row-context";
import { Menu } from "@mantine/core";
import Link from "next/link";

export default function HairUsedTableRowActionViewHairOrder() {
	const { hair } = useHairUsedTableRowContext();

	if (!hair.hairOrderId) return null;

	return (
		<Menu.Item
			component={Link}
			href={`/dashboard/hair-orders/${hair.hairOrderId}`}
			disabled={!hair.hairOrderId}
		>
			View Hair Order
		</Menu.Item>
	);
}
