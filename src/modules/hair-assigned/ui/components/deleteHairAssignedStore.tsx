import { create } from "zustand";

type State = {
	isOpen: boolean;
	hairAssignedId: string | null;
	onSuccess: () => void;
};

type Actions = {
	openDeleteHairAssignedDrawer(data: Partial<State>): void;
	reset(): void;
};

const initialState: State = {
	isOpen: false,
	hairAssignedId: null,
	onSuccess: async () => {},
};

const useDeleteHairAssignedStore = create<State & { actions: Actions }>(
	(set) => ({
		...initialState,
		actions: {
			openDeleteHairAssignedDrawer: (data: Partial<State>) =>
				set(() => ({ ...data, isOpen: true })),
			reset: () => {
				set(initialState);
			},
		},
	}),
);

export const useDeleteHairAssignedStoreDrawerIsOpen = () =>
	useDeleteHairAssignedStore((state) => state.isOpen);

export const useDeleteHairAssignedDrawerHairAssignedId = () =>
	useDeleteHairAssignedStore((state) => state.hairAssignedId);

export const useDeleteHairAssignedStoreDrawerOnSuccess = () =>
	useDeleteHairAssignedStore((state) => state.onSuccess);

export const useDeleteHairAssignedStoreActions = () =>
	useDeleteHairAssignedStore((state) => state.actions);
