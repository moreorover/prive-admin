import { Button, Menu, Table } from "@mantine/core";
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
					<Button>Manage</Button>
				</Menu.Target>

				<Menu.Dropdown>{children}</Menu.Dropdown>
			</Menu>
		</Table.Td>
	);
}
