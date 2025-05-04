import { useHairUsedTableRowContext } from "@/modules/ui/components/hair-used-table/hair-used-table-row-context";
import { Table, Text } from "@mantine/core";

function HairUsedTableRowWeight() {
	const { hair } = useHairUsedTableRowContext();
	return (
		<Table.Td>
			<Text>{hair.weightInGrams}g</Text>
		</Table.Td>
	);
}

export default HairUsedTableRowWeight;
