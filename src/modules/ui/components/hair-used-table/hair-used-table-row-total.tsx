import { formatAmount } from "@/lib/helpers";
import { useHairUsedTableRowContext } from "@/modules/ui/components/hair-used-table/hair-used-table-row-context";
import { Table, Text } from "@mantine/core";

export default function HairUsedTableRowTotal() {
	const { hair } = useHairUsedTableRowContext();
	return (
		<Table.Td>
			<Text>{formatAmount(hair.total / 100)}</Text>
		</Table.Td>
	);
}
