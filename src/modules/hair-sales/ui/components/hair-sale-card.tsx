import type { GetAllHairSales } from "@/modules/hair-sales/types";
import {
	Badge,
	Button,
	Divider,
	Flex,
	Group,
	Paper,
	Text,
} from "@mantine/core";
import dayjs from "dayjs";
import { Calendar, Coins, Eye, Scale, UserCircle } from "lucide-react";
import Link from "next/link";

interface Props {
	hairSale: GetAllHairSales[0];
}

export default function HairSaleCard({ hairSale }: Props) {
	return (
		<Paper key={hairSale.id} p="md" radius="md" withBorder shadow="sm">
			<Flex direction="column" gap="sm">
				<Group justify="space-between">
					<Badge size="lg" radius="sm" leftSection={<Calendar size={14} />}>
						{dayjs(hairSale.placedAt).format("MMM D, YYYY h:mm A")}
					</Badge>
					<Text fw={700} c="dimmed" size="sm">
						#{hairSale.id}
					</Text>
				</Group>

				<Divider />

				<Group gap="xs">
					<Scale size={18} />
					<Text fw={600}>Weight:</Text>
					<Text>{hairSale.weightInGrams}g</Text>
				</Group>

				<Group gap="xs">
					<Coins size={18} />
					<Text fw={600}>Price per gram:</Text>
					<Text>${hairSale.pricePerGram.toFixed(2)}</Text>
				</Group>

				<Divider />

				<Group justify="space-between">
					<Text fw={600}>Total Price:</Text>
					<Text fw={700} size="lg" c="blue">
						$
						{((hairSale.weightInGrams * hairSale.pricePerGram) / 100).toFixed(
							2,
						)}
					</Text>
				</Group>

				<Divider />

				<Flex direction="column" gap="xs">
					<Group gap="xs">
						<UserCircle size={18} />
						<Text fw={600}>Customer:</Text>
						<Text>{hairSale.customer.name}</Text>
					</Group>

					<Group gap="xs">
						<UserCircle size={18} />
						<Text fw={600}>Creator:</Text>
						<Text>{hairSale.createdBy.name}</Text>
					</Group>
				</Flex>

				{/* Button at the bottom of the card */}
				<Button
					component={Link}
					href={`/dashboard/hair-hairSales/${hairSale.id}`}
					variant="light"
					color="blue"
					size="sm"
					mt="md"
					leftSection={<Eye size={16} />}
					fullWidth
				>
					View Details
				</Button>
			</Flex>
		</Paper>
	);
}
