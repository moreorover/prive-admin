import { useHairSaleCardContext } from "@/modules/hair-sales/ui/components/hair-sale-card-context";
import { Group, Text } from "@mantine/core";
import { UserCircle } from "lucide-react";

function HairSaleCreator() {
	const { hairSale } = useHairSaleCardContext();
	return (
		<Group gap="xs">
			<UserCircle size={18} />
			<Text fw={600}>Creator:</Text>
			<Text>{hairSale.createdBy.name}</Text>
		</Group>
	);
}

export default HairSaleCreator;
