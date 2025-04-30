import type { GetAllHairSales } from "@/modules/hair-sales/types";
import HairSaleCard from "@/modules/hair-sales/ui/components/hair-sale-card";
import { Box, SimpleGrid, Text } from "@mantine/core";

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
					<HairSaleCard key={sale.id} hairSale={sale} />
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
