import { create } from "zustand";

type State = {
	isOpen: boolean;
	hairAssignedId: string | null;
	onSuccess: () => void;
};

type Actions = {
	openEditHairAssignedDrawer(data: Partial<State>): void;
	reset(): void;
};

const initialState: State = {
	isOpen: false,
	hairAssignedId: null,
	onSuccess: async () => {},
};

const useEditHairAssignedStore = create<State & { actions: Actions }>(
	(set) => ({
		...initialState,
		actions: {
			openEditHairAssignedDrawer: (data: Partial<State>) =>
				set(() => ({ ...data, isOpen: true })),
			reset: () => {
				set(initialState);
			},
		},
	}),
);

export const useEditHairAssignedStoreDrawerIsOpen = () =>
	useEditHairAssignedStore((state) => state.isOpen);

export const useEditHairAssignedDrawerHairAssignedId = () =>
	useEditHairAssignedStore((state) => state.hairAssignedId);

export const useEditHairAssignedStoreDrawerOnSuccess = () =>
	useEditHairAssignedStore((state) => state.onSuccess);

export const useEditHairAssignedStoreActions = () =>
	useEditHairAssignedStore((state) => state.actions);
