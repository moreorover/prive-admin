import { useTransactionsTableRowContext } from "@/modules/ui/components/transactions-table/transactions-table-row-context";
import { Badge, Group, Table, Text, Tooltip } from "@mantine/core";
import dayjs from "dayjs";
import { AlertTriangle, Check, Clock } from "lucide-react";

export default function TransactionsTableRowCompletedAt() {
	const { transaction } = useTransactionsTableRowContext();

	const statusProps = {
		COMPLETED: { color: "green", icon: <Check size={14} /> },
		PENDING: { color: "pink", icon: <Clock size={14} /> },
	};

	const completedDate = dayjs(transaction.completedDateBy);
	const isOverdue =
		transaction.status === "PENDING" && completedDate.isBefore(dayjs(), "day");

	const { color, icon } = statusProps[
		transaction.status as keyof typeof statusProps
	] ?? {
		color: "gray",
		icon: null,
	};

	return (
		<Table.Td>
			<Group gap="sm" align="center">
				<Badge
					color={color}
					leftSection={icon}
					radius="sm"
					size="sm"
					variant="light"
				>
					{transaction.status}
				</Badge>

				<Group gap="sm">
					<Text size="xs" fw={500} c={isOverdue ? "red" : "dimmed"}>
						{completedDate.format("DD MMM YYYY")}
					</Text>

					{isOverdue && (
						<Tooltip label="This pending transaction is overdue" withArrow>
							<AlertTriangle size={14} color="red" />
						</Tooltip>
					)}
				</Group>
			</Group>
		</Table.Td>
	);
}
