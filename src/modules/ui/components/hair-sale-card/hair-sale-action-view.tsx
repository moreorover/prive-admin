import { useHairSaleCardContext } from "@/modules/ui/components/hair-sale-card/hair-sale-card-context";
import { Button } from "@mantine/core";
import { Eye } from "lucide-react";
import Link from "next/link";

function HairSaleActionView() {
	const { hairSale } = useHairSaleCardContext();
	return (
		<Button
			component={Link}
			href={`/dashboard/hair-sales/${hairSale.id}`}
			variant="light"
			color="blue"
			size="sm"
			mt="md"
			leftSection={<Eye size={16} />}
			fullWidth
		>
			View Details
		</Button>
	);
}

export default HairSaleActionView;
