import { create } from "zustand";

type State = {
	isOpen: boolean;
	noteId: string | null;
	onSuccess: () => void;
};

type Actions = {
	openDeleteNoteDrawer(data: Partial<State>): void;
	reset(): void;
};

const initialState: State = {
	isOpen: false,
	noteId: null,
	onSuccess: async () => {},
};

const useDeleteNoteStore = create<State & { actions: Actions }>((set) => ({
	...initialState,
	actions: {
		openDeleteNoteDrawer: (data: Partial<State>) =>
			set(() => ({ ...data, isOpen: true })),
		reset: () => {
			set(initialState);
		},
	},
}));

export const useDeleteNoteStoreDrawerIsOpen = () =>
	useDeleteNoteStore((state) => state.isOpen);

export const useDeleteNoteStoreDrawerNoteId = () =>
	useDeleteNoteStore((state) => state.noteId);

export const useDeleteNoteStoreDrawerOnSuccess = () =>
	useDeleteNoteStore((state) => state.onSuccess);

export const useDeleteNoteStoreActions = () =>
	useDeleteNoteStore((state) => state.actions);
