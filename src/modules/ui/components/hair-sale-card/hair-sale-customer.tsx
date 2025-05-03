import { useHairSaleCardContext } from "@/modules/ui/components/hair-sale-card/hair-sale-card-context";
import { Group, Text } from "@mantine/core";
import { UserCircle } from "lucide-react";

function HairSaleCustomer() {
	const { hairSale } = useHairSaleCardContext();
	return (
		<Group gap="xs">
			<UserCircle size={18} />
			<Text fw={600}>Customer:</Text>
			<Text>{hairSale.customer.name}</Text>
		</Group>
	);
}

export default HairSaleCustomer;
