import { useHairSaleCardContext } from "@/modules/hair-sales/ui/components/hair-sale-card-context";
import { Group, Text } from "@mantine/core";
import { Coins } from "lucide-react";

function HairSalePricePerGram() {
	const { hairSale } = useHairSaleCardContext();
	return (
		<Group gap="xs">
			<Coins size={18} />
			<Text fw={600}>Price per gram:</Text>
			<Text>${hairSale.pricePerGram.toFixed(2)}</Text>
		</Group>
	);
}

export default HairSalePricePerGram;
