import { formatAmount } from "@/lib/helpers";
import { useHairUsedTableRowContext } from "@/modules/ui/components/hair-used-table/hair-used-table-row-context";
import { Group, Table, Text, Tooltip } from "@mantine/core";
import { TriangleAlertIcon } from "lucide-react";

function HairUsedTableRowSoldFor() {
	const { hair } = useHairUsedTableRowContext();
	return (
		<Table.Td
			style={{
				backgroundColor: hair.soldFor === 0 ? "#ffe6e6" : undefined, // light pink
			}}
		>
			<Group>
				<Text>{formatAmount(hair.soldFor / 100)}</Text>
				{hair.soldFor === 0 && (
					<Tooltip label="Sold for price not assigned">
						<TriangleAlertIcon size={16} color="red" />
					</Tooltip>
				)}
			</Group>
		</Table.Td>
	);
}

export default HairUsedTableRowSoldFor;
