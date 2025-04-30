import {
	ActionIcon,
	Badge,
	Box,
	Divider,
	Flex,
	Group,
	Paper,
	Select,
	SimpleGrid,
	Text,
	TextInput,
	Title,
} from "@mantine/core";
import dayjs from "dayjs";
import {
	Calendar,
	Coins,
	Scale,
	Search,
	SortAsc,
	SortDesc,
	UserCircle,
} from "lucide-react";
import { useState } from "react";

// Mock data for sales
const mockSales = [
	{
		id: 1,
		placedAt: "2025-04-28T10:30:00",
		weightInGrams: 120,
		pricePerGram: 12.5,
		totalPrice: 1500,
		customerName: "John Doe",
		creatorName: "Emma Smith",
	},
	{
		id: 2,
		placedAt: "2025-04-27T14:15:00",
		weightInGrams: 85,
		pricePerGram: 15.2,
		totalPrice: 1292,
		customerName: "Sarah Johnson",
		creatorName: "Michael Brown",
	},
	{
		id: 3,
		placedAt: "2025-04-26T09:45:00",
		weightInGrams: 200,
		pricePerGram: 10.0,
		totalPrice: 2000,
		customerName: "Robert Williams",
		creatorName: "Emma Smith",
	},
	{
		id: 4,
		placedAt: "2025-04-25T16:20:00",
		weightInGrams: 150,
		pricePerGram: 11.8,
		totalPrice: 1770,
		customerName: "Lisa Taylor",
		creatorName: "James Wilson",
	},
	{
		id: 5,
		placedAt: "2025-04-24T11:00:00",
		weightInGrams: 75,
		pricePerGram: 16.0,
		totalPrice: 1200,
		customerName: "David Miller",
		creatorName: "Michael Brown",
	},
	{
		id: 6,
		placedAt: "2025-04-23T13:30:00",
		weightInGrams: 180,
		pricePerGram: 9.5,
		totalPrice: 1710,
		customerName: "Jennifer Clark",
		creatorName: "James Wilson",
	},
];

export default function SalesPage() {
	// biome-ignore lint/correctness/noUnusedVariables: <explanation>
	const [sales, setSales] = useState(mockSales);
	const [searchQuery, setSearchQuery] = useState("");
	const [sortField, setSortField] = useState("placedAt");
	const [sortDirection, setSortDirection] = useState("desc");

	// Filter sales based on search query
	const filteredSales = sales.filter(
		(sale) =>
			sale.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
			sale.creatorName.toLowerCase().includes(searchQuery.toLowerCase()),
	);

	// Sort sales based on sort field and direction
	const sortedSales = [...filteredSales].sort((a, b) => {
		if (sortField === "placedAt") {
			return sortDirection === "asc"
				? dayjs(a.placedAt).unix() - dayjs(b.placedAt).unix()
				: dayjs(b.placedAt).unix() - dayjs(a.placedAt).unix();
			// biome-ignore lint/style/noUselessElse: <explanation>
		} else if (sortField === "totalPrice") {
			return sortDirection === "asc"
				? a.totalPrice - b.totalPrice
				: b.totalPrice - a.totalPrice;
			// biome-ignore lint/style/noUselessElse: <explanation>
		} else if (sortField === "weightInGrams") {
			return sortDirection === "asc"
				? a.weightInGrams - b.weightInGrams
				: b.weightInGrams - a.weightInGrams;
		}
		return 0;
	});

	// Toggle sort direction
	const toggleSortDirection = () => {
		setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
	};

	return (
		<>
			{/*<Container size="xl" py="xl">*/}
			<Title order={1} mb="lg">
				Sales Records
			</Title>

			{/* Search and filter controls */}
			<Flex mb="lg" gap="md" wrap="wrap">
				<TextInput
					placeholder="Search by customer or creator"
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					leftSection={<Search size={16} />}
					style={{ flexGrow: 1 }}
				/>

				<Group>
					<Select
						placeholder="Sort by"
						data={[
							{ value: "placedAt", label: "Date" },
							{ value: "totalPrice", label: "Total Price" },
							{ value: "weightInGrams", label: "Weight" },
						]}
						value={sortField}
						// biome-ignore lint/style/noNonNullAssertion: <explanation>
						onChange={(e) => setSortField(e!)}
						style={{ width: 150 }}
					/>

					<ActionIcon variant="light" onClick={toggleSortDirection}>
						{sortDirection === "asc" ? (
							<SortAsc size={20} />
						) : (
							<SortDesc size={20} />
						)}
					</ActionIcon>
				</Group>
			</Flex>

			{/* Sale cards */}
			<SimpleGrid
				cols={{ base: 1, md: 2, lg: 3 }}
				spacing={{ base: "md", sm: "lg" }}
			>
				{sortedSales.map((sale) => (
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
									${sale.totalPrice.toFixed(2)}
								</Text>
							</Group>

							<Divider />

							<Flex direction="column" gap="xs">
								<Group gap="xs">
									<UserCircle size={18} />
									<Text fw={600}>Customer:</Text>
									<Text>{sale.customerName}</Text>
								</Group>

								<Group gap="xs">
									<UserCircle size={18} />
									<Text fw={600}>Creator:</Text>
									<Text>{sale.creatorName}</Text>
								</Group>
							</Flex>
						</Flex>
					</Paper>
				))}
			</SimpleGrid>

			{/* Show message when no results are found */}
			{sortedSales.length === 0 && (
				<Box ta="center" mt="xl">
					<Text size="lg">No sales records found.</Text>
				</Box>
			)}
			{/*</Container>*/}
		</>
	);
}
