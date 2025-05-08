import { create } from "zustand";

type State = {
	isOpen: boolean;
	hairAssignmentId: string | null;
	onSuccess: () => void;
};

type Actions = {
	openEditHairAssignmentDrawer(data: Partial<State>): void;
	reset(): void;
};

const initialState: State = {
	isOpen: false,
	hairAssignmentId: null,
	onSuccess: () => {},
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

export const useEditHairAssignmentToSaleStoreDrawerHairAssignmentId = () =>
	useEditHairAssignmentToSaleStore((state) => state.hairAssignmentId);

export const useEditHairAssignmentToSaleStoreDrawerOnSuccess = () =>
	useEditHairAssignmentToSaleStore((state) => state.onSuccess);

export const useEditHairAssignmentToSaleStoreActions = () =>
	useEditHairAssignmentToSaleStore((state) => state.actions);
