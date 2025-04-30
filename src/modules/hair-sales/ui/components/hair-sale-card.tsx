import type { GetAllHairSales } from "@/modules/hair-sales/types";
import HairSaleCardContext from "@/modules/hair-sales/ui/components/hair-sale-card-context";
import HairSaleCardPricePerGram from "@/modules/hair-sales/ui/components/hair-sale-card-pricePerGram";
import HairSaleCardWeight from "@/modules/hair-sales/ui/components/hair-sale-card-weight";
import HairSaleTitle from "@/modules/hair-sales/ui/components/hair-sale-title";
import HairSaleTotal from "@/modules/hair-sales/ui/components/hair-sale-total";
import { Button, Divider, Flex, Group, Paper, Text } from "@mantine/core";
import { Eye, UserCircle } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

interface Props {
	hairSale: GetAllHairSales[0];
	title?: ReactNode;
	weight?: ReactNode;
	pricePerGram?: ReactNode;
	total?: ReactNode;
}

function HairSaleCard({ hairSale, title, weight, pricePerGram, total }: Props) {
	return (
		<HairSaleCardContext.Provider value={{ hairSale }}>
			<Paper key={hairSale.id} p="md" radius="md" withBorder shadow="sm">
				<Flex direction="column" gap="sm">
					{title}

					{title && <Divider />}

					{weight}

					{pricePerGram}

					{(weight || pricePerGram) && <Divider />}

					{total}

					{total && <Divider />}

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
		</HairSaleCardContext.Provider>
	);
}

HairSaleCard.Title = HairSaleTitle;
HairSaleCard.Weight = HairSaleCardWeight;
HairSaleCard.PricePerGram = HairSaleCardPricePerGram;
HairSaleCard.Total = HairSaleTotal;

export default HairSaleCard;
