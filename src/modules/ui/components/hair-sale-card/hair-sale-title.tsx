import { useHairSaleCardContext } from "@/modules/ui/components/hair-sale-card/hair-sale-card-context";
import { Badge, Group } from "@mantine/core";
import dayjs from "dayjs";
import { Calendar } from "lucide-react";

function HairSaleTitle() {
	const { hairSale } = useHairSaleCardContext();
	return (
		<Group justify="space-between">
			<Badge size="lg" radius="sm" leftSection={<Calendar size={14} />}>
				{dayjs(hairSale.placedAt).format("MMM D, YYYY")}
			</Badge>
			{/*<Text fw={700} c="dimmed" size="sm">*/}
			{/*	{hairSale.id}*/}
			{/*</Text>*/}
		</Group>
	);
}

export default HairSaleTitle;
