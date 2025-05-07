import { useEditHairAssignmentToAppointmentStoreActions } from "@/modules/appointments/ui/components/editHairAssignementToAppointmentStore";
import { useHairUsedTableRowContext } from "@/modules/ui/components/hair-used-table/hair-used-table-row-context";
import { Menu } from "@mantine/core";

interface Props {
	onUpdated: () => void;
}

export default function HairUsedTableRowActionUpdate({ onUpdated }: Props) {
	const { hair } = useHairUsedTableRowContext();

	const { openEditHairAssignmentDrawer } =
		useEditHairAssignmentToAppointmentStoreActions();

	return (
		<Menu.Item
			onClick={() =>
				openEditHairAssignmentDrawer({
					hairAssignmentId: hair.id,
					onSuccess: onUpdated,
				})
			}
		>
			Update
		</Menu.Item>
	);
}
