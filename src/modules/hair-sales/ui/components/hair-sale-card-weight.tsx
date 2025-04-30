import { useHairSaleCardContext } from "@/modules/hair-sales/ui/components/hair-sale-card-context";
import { Group, Text } from "@mantine/core";
import { Scale } from "lucide-react";

function HairSaleWeight() {
	const { hairSale } = useHairSaleCardContext();
	return (
		<Group gap="xs">
			<Scale size={18} />
			<Text fw={600}>Weight:</Text>
			<Text>{hairSale.weightInGrams}g</Text>
		</Group>
	);
}

export default HairSaleWeight;
