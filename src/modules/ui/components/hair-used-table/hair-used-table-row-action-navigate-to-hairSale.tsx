import { useHairUsedTableRowContext } from "@/modules/ui/components/hair-used-table/hair-used-table-row-context";
import { Menu } from "@mantine/core";
import Link from "next/link";

export default function HairUsedTableRowActionViewHairSale() {
	const { hair } = useHairUsedTableRowContext();

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
