import { ActionIcon, Menu, Table } from "@mantine/core";
import { GripVertical } from "lucide-react";
import type { ReactNode } from "react";

export type Props = {
	children: ReactNode;
};

export default function HairUsedInAppointmentsTableRowActions({
	children,
}: Props) {
	return (
		<Table.Td>
			<Menu shadow="md" width={200}>
				<Menu.Target>
					<ActionIcon variant="transparent">
						<GripVertical size={18} />
					</ActionIcon>
				</Menu.Target>

				<Menu.Dropdown>{children}</Menu.Dropdown>
			</Menu>
		</Table.Td>
	);
}
