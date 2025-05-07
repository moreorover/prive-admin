import { create } from "zustand";

type State = {
	isOpen: boolean;
	hairOrderNoteId: string | null;
	onSuccess: () => void;
};

type Actions = {
	openDeleteHairOrderNoteDrawer(data: Partial<State>): void;
	reset(): void;
};

const initialState: State = {
	isOpen: false,
	hairOrderNoteId: null,
	onSuccess: () => {},
};

const useDeleteHairOrderNoteStore = create<State & { actions: Actions }>(
	(set) => ({
		...initialState,
		actions: {
			openDeleteHairOrderNoteDrawer: (data: Partial<State>) =>
				set(() => ({ ...data, isOpen: true })),
			reset: () => {
				set(initialState);
			},
		},
	}),
);

export const useDeleteHairOrderNoteStoreDrawerIsOpen = () =>
	useDeleteHairOrderNoteStore((state) => state.isOpen);

export const useDeleteHairOrderNoteStoreDrawerHairOrderNoteId = () =>
	useDeleteHairOrderNoteStore((state) => state.hairOrderNoteId);

export const useDeleteHairOrderNoteStoreDrawerOnSuccess = () =>
	useDeleteHairOrderNoteStore((state) => state.onSuccess);

export const useDeleteHairOrderNoteStoreActions = () =>
	useDeleteHairOrderNoteStore((state) => state.actions);
