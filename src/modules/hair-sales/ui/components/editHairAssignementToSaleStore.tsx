import type { HairAssignedToSale } from "@/lib/schemas";
import { create } from "zustand";

type State = {
	isOpen: boolean;
	hairAssignment: HairAssignedToSale;
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
		hairSaleId: "",
		weightInGrams: 0,
		soldFor: 0,
	},
	maxWeight: 0,
	onUpdated: () => {},
};

export const useEditHairAssignmentToSaleStore = create<
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

export const useEditHairAssignmentToSaleStoreDrawerIsOpen = () =>
	useEditHairAssignmentToSaleStore((state) => state.isOpen);

export const useEditHairAssignmentToSaleStoreDrawerMaxWeight = () =>
	useEditHairAssignmentToSaleStore((state) => state.maxWeight);

export const useEditHairAssignmentToSaleStoreDrawerHairAssignment = () =>
	useEditHairAssignmentToSaleStore((state) => state.hairAssignment);

export const useEditHairAssignmentToSaleStoreDrawerOnUpdated = () =>
	useEditHairAssignmentToSaleStore((state) => state.onUpdated);

export const useEditHairAssignmentToSaleStoreActions = () =>
	useEditHairAssignmentToSaleStore((state) => state.actions);
