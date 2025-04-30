import { useHairSaleCardContext } from "@/modules/hair-sales/ui/components/hair-sale-card-context";
import { Group, Text } from "@mantine/core";

function HairSaleTotal() {
	const { hairSale } = useHairSaleCardContext();
	return (
		<Group justify="space-between">
			<Text fw={600}>Total Price:</Text>
			<Text fw={700} size="lg" c="blue">
				${((hairSale.weightInGrams * hairSale.pricePerGram) / 100).toFixed(2)}
			</Text>
		</Group>
	);
}

export default HairSaleTotal;
