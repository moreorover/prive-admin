import type { GetAllHairSales } from "@/modules/hair-sales/types";
import HairSaleActionView from "@/modules/hair-sales/ui/components/hair-sale-action-view";
import HairSaleActions from "@/modules/hair-sales/ui/components/hair-sale-actions";
import HairSaleCardContext from "@/modules/hair-sales/ui/components/hair-sale-card-context";
import HairSalePricePerGram from "@/modules/hair-sales/ui/components/hair-sale-card-pricePerGram";
import HairSaleWeight from "@/modules/hair-sales/ui/components/hair-sale-card-weight";
import HairSaleCreator from "@/modules/hair-sales/ui/components/hair-sale-creator";
import HairSaleCustomer from "@/modules/hair-sales/ui/components/hair-sale-customer";
import HairSaleOwners from "@/modules/hair-sales/ui/components/hair-sale-owners";
import HairSaleTitle from "@/modules/hair-sales/ui/components/hair-sale-title";
import HairSaleTotal from "@/modules/hair-sales/ui/components/hair-sale-total";
import { Divider, Flex, Paper } from "@mantine/core";
import type { ReactNode } from "react";

interface Props {
	hairSale: GetAllHairSales[0];
	title?: ReactNode;
	weight?: ReactNode;
	pricePerGram?: ReactNode;
	total?: ReactNode;
	owners?: ReactNode;
	actions?: ReactNode;
}

function HairSaleCard({
	hairSale,
	title = <HairSaleTitle />,
	weight = <HairSaleWeight />,
	pricePerGram = <HairSalePricePerGram />,
	total = <HairSaleTotal />,
	owners = (
		<HairSaleOwners>
			<HairSaleCustomer />
			<HairSaleCreator />
		</HairSaleOwners>
	),
	actions = (
		<HairSaleActions>
			<HairSaleActionView />
		</HairSaleActions>
	),
}: Props) {
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

					{owners}

					{actions}
				</Flex>
			</Paper>
		</HairSaleCardContext.Provider>
	);
}

HairSaleCard.Title = HairSaleTitle;
HairSaleCard.Weight = HairSaleWeight;
HairSaleCard.PricePerGram = HairSalePricePerGram;
HairSaleCard.Total = HairSaleTotal;
HairSaleCard.Owners = HairSaleOwners;
HairSaleCard.Customer = HairSaleCustomer;
HairSaleCard.Creator = HairSaleCreator;
HairSaleCard.Actions = HairSaleActions;
HairSaleCard.ActionView = HairSaleActionView;

export default HairSaleCard;
