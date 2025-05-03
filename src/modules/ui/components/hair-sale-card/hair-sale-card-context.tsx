import type { GetAllHairSales } from "@/modules/hair-sales/types";
import { createContext, useContext } from "react";

const HairSaleCardContext = createContext<{
	hairSale: GetAllHairSales[0];
} | null>(null);

export function useHairSaleCardContext() {
	const context = useContext(HairSaleCardContext);
	if (!context) {
		throw new Error(
			"HairSaleCard.* component must be rendered as child of HairSaleCard component",
		);
	}
	return context;
}

export default HairSaleCardContext;
