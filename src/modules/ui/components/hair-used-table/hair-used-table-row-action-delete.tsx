import { useDeleteHairAssignmentToAppointmentStoreActions } from "@/modules/appointments/ui/components/deleteHairAssignementToAppointmentStore";
import { useHairUsedTableRowContext } from "@/modules/ui/components/hair-used-table/hair-used-table-row-context";
import { Menu } from "@mantine/core";

interface Props {
	onDeleted: () => void;
}

export default function HairUsedTableRowActionDelete({ onDeleted }: Props) {
	const { hair } = useHairUsedTableRowContext();
	const { openDeleteHairAssignmentDrawer } =
		useDeleteHairAssignmentToAppointmentStoreActions();
	return (
		<Menu.Item
			onClick={() =>
				openDeleteHairAssignmentDrawer({ hairAssignmentId: hair.id, onDeleted })
			}
		>
			Delete
		</Menu.Item>
	);
}
