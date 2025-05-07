import { create } from "zustand";

type State = {
	isOpen: boolean;
	hairOrderNoteId: string | null;
	onSuccess?: () => void;
};

type Actions = {
	openEditHairOrderNoteDrawer(data: Partial<State>): void;
	reset(): void;
};

const initialState: State = {
	isOpen: false,
	hairOrderNoteId: null,
	onSuccess: undefined,
};

const useHairOrderNoteDrawerStore = create<State & { actions: Actions }>(
	(set) => ({
		...initialState,
		actions: {
			openEditHairOrderNoteDrawer: (data: Partial<State>) =>
				set(() => ({ ...data, isOpen: true })),
			reset: () => {
				set(initialState);
			},
		},
	}),
);

export const useEditHairOrderNoteStoreDrawerIsOpen = () =>
	useHairOrderNoteDrawerStore((state) => state.isOpen);

export const useEditHairOrderNoteStoreDrawerHairOrderNoteId = () =>
	useHairOrderNoteDrawerStore((state) => state.hairOrderNoteId);

export const useEditHairOrderNoteStoreDrawerOnSuccess = () =>
	useHairOrderNoteDrawerStore((state) => state.onSuccess);

export const useEditHairOrderNoteStoreActions = () =>
	useHairOrderNoteDrawerStore((state) => state.actions);
