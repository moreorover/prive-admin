import type { GetAllHairSales } from "@/modules/hair-sales/types";
import {
	Badge,
	Box,
	Button,
	Divider,
	Flex,
	Group,
	Paper,
	SimpleGrid,
	Text,
} from "@mantine/core";
import dayjs from "dayjs";
import { Calendar, Coins, Eye, Scale, UserCircle } from "lucide-react";
import Link from "next/link";

interface Props {
	hairSales: GetAllHairSales;
}

export default function HairSalesGrid({ hairSales }: Props) {
	return (
		<>
			<SimpleGrid
				cols={{ base: 1, md: 2, lg: 3 }}
				spacing={{ base: "md", sm: "lg" }}
			>
				{hairSales.map((sale) => (
					<Paper key={sale.id} p="md" radius="md" withBorder shadow="sm">
						<Flex direction="column" gap="sm">
							<Group justify="space-between">
								<Badge
									size="lg"
									radius="sm"
									leftSection={<Calendar size={14} />}
								>
									{dayjs(sale.placedAt).format("MMM D, YYYY h:mm A")}
								</Badge>
								<Text fw={700} c="dimmed" size="sm">
									#{sale.id}
								</Text>
							</Group>

							<Divider />

							<Group gap="xs">
								<Scale size={18} />
								<Text fw={600}>Weight:</Text>
								<Text>{sale.weightInGrams}g</Text>
							</Group>

							<Group gap="xs">
								<Coins size={18} />
								<Text fw={600}>Price per gram:</Text>
								<Text>${sale.pricePerGram.toFixed(2)}</Text>
							</Group>

							<Divider />

							<Group justify="space-between">
								<Text fw={600}>Total Price:</Text>
								<Text fw={700} size="lg" c="blue">
									${((sale.weightInGrams * sale.pricePerGram) / 100).toFixed(2)}
								</Text>
							</Group>

							<Divider />

							<Flex direction="column" gap="xs">
								<Group gap="xs">
									<UserCircle size={18} />
									<Text fw={600}>Customer:</Text>
									<Text>{sale.customer.name}</Text>
								</Group>

								<Group gap="xs">
									<UserCircle size={18} />
									<Text fw={600}>Creator:</Text>
									<Text>{sale.createdBy.name}</Text>
								</Group>
							</Flex>

							{/* Button at the bottom of the card */}
							<Button
								component={Link}
								href={`/dashboard/hair-sales/${sale.id}`}
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
				))}
			</SimpleGrid>

			{/* Show message when no results are found */}
			{hairSales.length === 0 && (
				<Box ta="center" mt="xl">
					<Text size="lg">No hair sales records found.</Text>
				</Box>
			)}
		</>
	);
}
