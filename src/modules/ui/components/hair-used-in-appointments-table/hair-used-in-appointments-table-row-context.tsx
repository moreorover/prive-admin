import type { GetHairAssignmentsToAppointment } from "@/modules/hair_orders/types";
import { createContext, useContext } from "react";

const HairUsedInAppointmentsTableRowContext = createContext<{
	hair: GetHairAssignmentsToAppointment[0];
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
