import { useHairUsedTableRowContext } from "@/modules/ui/components/hair-used-table/hair-used-table-row-context";
import { Group, Table, Text, Tooltip } from "@mantine/core";
import { TriangleAlertIcon } from "lucide-react";

function HairUsedTableRowWeight() {
	const { hair } = useHairUsedTableRowContext();
	return (
		<Table.Td
			style={{
				backgroundColor: hair.weightInGrams === 0 ? "#ffe6e6" : undefined, // light pink
			}}
		>
			<Group>
				<Text>{hair.weightInGrams}g</Text>
				{hair.weightInGrams === 0 && (
					<Tooltip label="Weight not assigned">
						<TriangleAlertIcon size={16} color="red" />
					</Tooltip>
				)}
			</Group>
		</Table.Td>
	);
}

export default HairUsedTableRowWeight;
