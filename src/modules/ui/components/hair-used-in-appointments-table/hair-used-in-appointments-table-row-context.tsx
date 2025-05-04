import type { Hair } from "@/modules/ui/components/hair-used-in-appointments-table/hair-used-in-appointments-table";
import { createContext, useContext } from "react";

const HairUsedInAppointmentsTableRowContext = createContext<{
	hair: Hair;
} | null>(null);

export function useHairUsedInAppointmentsTableRowContext() {
	const context = useContext(HairUsedInAppointmentsTableRowContext);
	if (!context) {
		throw new Error(
			"HairUsedInAppointmentsTableRow.* component must be rendered as child of HairUsedInAppointmentsTableRow component",
		);
	}
	return context;
}

export default HairUsedInAppointmentsTableRowContext;
