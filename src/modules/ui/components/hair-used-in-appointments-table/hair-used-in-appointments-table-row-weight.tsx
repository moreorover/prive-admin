import { useHairUsedInAppointmentsTableRowContext } from "@/modules/ui/components/hair-used-in-appointments-table/hair-used-in-appointments-table-row-context";
import { Table, Text } from "@mantine/core";

function HairUsedInAppointmentsTableRowWeight() {
	const { hair } = useHairUsedInAppointmentsTableRowContext();
	return (
		<Table.Td>
			<Text>{hair.weightInGrams}g</Text>
		</Table.Td>
	);
}

export default HairUsedInAppointmentsTableRowWeight;
