import type { GetHairAssignmentsToAppointment } from "@/modules/hair_orders/types";
import { createContext, useContext } from "react";

const HairUsedInAppointmentsTableContext = createContext<{
	hair: GetHairAssignmentsToAppointment;
} | null>(null);

export function useHairUsedInAppointmentsTableContext() {
	const context = useContext(HairUsedInAppointmentsTableContext);
	if (!context) {
		throw new Error(
			"HairUsedInAppointmentsTable.* component must be rendered as child of HairUsedInAppointmentsTable component",
		);
	}
	return context;
}

export default HairUsedInAppointmentsTableContext;
