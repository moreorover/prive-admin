import { create } from "zustand";

type State = {
	isOpen: boolean;
	hairAssignmentId: string | null;
	onSuccess: () => void;
};

type Actions = {
	openDeleteHairAssignmentDrawer(data: Partial<State>): void;
	reset(): void;
};

const initialState: State = {
	isOpen: false,
	hairAssignmentId: null,
	onSuccess: () => {},
};

const useDeleteHairAssignmentToSaleStore = create<State & { actions: Actions }>(
	(set) => ({
		...initialState,
		actions: {
			openDeleteHairAssignmentDrawer: (data: Partial<State>) =>
				set(() => ({ ...data, isOpen: true })),
			reset: () => {
				set(initialState);
			},
		},
	}),
);

export const useDeleteHairAssignmentToSaleStoreDrawerIsOpen = () =>
	useDeleteHairAssignmentToSaleStore((state) => state.isOpen);

export const useDeleteHairAssignmentToSaleStoreDrawerHairAssignmentId = () =>
	useDeleteHairAssignmentToSaleStore((state) => state.hairAssignmentId);

export const useDeleteHairAssignmentToSaleStoreDrawerOnSuccess = () =>
	useDeleteHairAssignmentToSaleStore((state) => state.onSuccess);

export const useDeleteHairAssignmentToSaleStoreActions = () =>
	useDeleteHairAssignmentToSaleStore((state) => state.actions);
