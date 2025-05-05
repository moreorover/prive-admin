import type { HairAssignedToAppointment } from "@/lib/schemas";
import { create } from "zustand";

type State = {
	isOpen: boolean;
	hairAssignment: HairAssignedToAppointment;
	maxWeight: number;
	onUpdated: () => void;
};

type Actions = {
	openEditHairAssignmentDrawer(data: Partial<State>): void;
	reset(): void;
};

const initialState: State = {
	isOpen: false,
	hairAssignment: {
		id: "",
		hairOrderId: "",
		appointmentId: "",
		weightInGrams: 0,
		soldFor: 0,
	},
	maxWeight: 0,
	onUpdated: () => {},
};

export const useEditHairAssignmentToAppointmentStore = create<
	State & { actions: Actions }
>((set) => ({
	...initialState,
	actions: {
		openEditHairAssignmentDrawer: (data: Partial<State>) =>
			set(() => ({ ...data, isOpen: true })),
		reset: () => {
			set(initialState);
		},
	},
}));

export const useEditHairAssignmentToAppointmentStoreDrawerIsOpen = () =>
	useEditHairAssignmentToAppointmentStore((state) => state.isOpen);

export const useEditHairAssignmentToAppointmentStoreDrawerMaxWeight = () =>
	useEditHairAssignmentToAppointmentStore((state) => state.maxWeight);

export const useEditHairAssignmentToAppointmentStoreDrawerHairAssignment = () =>
	useEditHairAssignmentToAppointmentStore((state) => state.hairAssignment);

export const useEditHairAssignmentToAppointmentStoreDrawerOnUpdated = () =>
	useEditHairAssignmentToAppointmentStore((state) => state.onUpdated);

export const useEditHairAssignmentToAppointmentStoreActions = () =>
	useEditHairAssignmentToAppointmentStore((state) => state.actions);
