import { useHairUsedTableRowContext } from "@/modules/ui/components/hair-used-table/hair-used-table-row-context";
import { Menu } from "@mantine/core";

interface Props {
	onAction: (id: string) => void;
}

export default function HairUsedTableRowActionUpdate({ onAction }: Props) {
	const { hair } = useHairUsedTableRowContext();
	return <Menu.Item onClick={() => onAction(hair.id)}>Update</Menu.Item>;
}
