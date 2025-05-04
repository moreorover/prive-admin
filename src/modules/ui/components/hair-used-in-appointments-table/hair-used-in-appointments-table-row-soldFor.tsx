import { formatAmount } from "@/lib/helpers";
import { useHairUsedInAppointmentsTableRowContext } from "@/modules/ui/components/hair-used-in-appointments-table/hair-used-in-appointments-table-row-context";
import { Table, Text } from "@mantine/core";

function HairUsedInAppointmentsTableRowSoldFor() {
	const { hair } = useHairUsedInAppointmentsTableRowContext();
	return (
		<Table.Td>
			<Text>{formatAmount(hair.soldFor / 100)}</Text>
		</Table.Td>
	);
}

export default HairUsedInAppointmentsTableRowSoldFor;
