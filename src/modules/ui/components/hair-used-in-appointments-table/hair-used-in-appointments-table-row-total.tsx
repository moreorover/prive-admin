import { formatAmount } from "@/lib/helpers";
import { useHairUsedInAppointmentsTableRowContext } from "@/modules/ui/components/hair-used-in-appointments-table/hair-used-in-appointments-table-row-context";
import { Table, Text } from "@mantine/core";

function HairUsedInAppointmentsTableRowTotal() {
	const { hair } = useHairUsedInAppointmentsTableRowContext();
	return (
		<Table.Td>
			<Text>{formatAmount(hair.total / 100)}</Text>
		</Table.Td>
	);
}

export default HairUsedInAppointmentsTableRowTotal;
