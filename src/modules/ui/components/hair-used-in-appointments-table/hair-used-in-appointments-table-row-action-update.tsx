import { useHairUsedInAppointmentsTableRowContext } from "@/modules/ui/components/hair-used-in-appointments-table/hair-used-in-appointments-table-row-context";
import { Menu } from "@mantine/core";

interface Props {
	onAction: (id: string) => void;
}

export default function HairUsedInAppointmentsTableRowActionUpdate({
	onAction,
}: Props) {
	const { hair } = useHairUsedInAppointmentsTableRowContext();
	return <Menu.Item onClick={() => onAction(hair.id)}>Update</Menu.Item>;
}
