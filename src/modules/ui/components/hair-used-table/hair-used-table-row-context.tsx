import type { Hair } from "@/modules/ui/components/hair-used-table/hair-used-table";
import { createContext, useContext } from "react";

const HairUsedTableRowContext = createContext<{
	hair: Hair;
} | null>(null);

export function useHairUsedTableRowContext() {
	const context = useContext(HairUsedTableRowContext);
	if (!context) {
		throw new Error(
			"HairUsedTableRow.* component must be rendered as child of HairUsedTableRow component",
		);
	}
	return context;
}

export default HairUsedTableRowContext;
