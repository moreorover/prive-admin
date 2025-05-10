import { create } from "zustand";

type State = {
	isOpen: boolean;
	noteId: string | null;
	onSuccess: () => void;
};

type Actions = {
	openEditNoteDrawer(data: Partial<State>): void;
	reset(): void;
};

const initialState: State = {
	isOpen: false,
	noteId: null,
	onSuccess: async () => {},
};

const useEditNoteStore = create<State & { actions: Actions }>((set) => ({
	...initialState,
	actions: {
		openEditNoteDrawer: (data: Partial<State>) =>
			set(() => ({ ...data, isOpen: true })),
		reset: () => {
			set(initialState);
		},
	},
}));

export const useEditNoteStoreDrawerIsOpen = () =>
	useEditNoteStore((state) => state.isOpen);

export const useEditNoteStoreDrawerNoteId = () =>
	useEditNoteStore((state) => state.noteId);

export const useEditNoteStoreDrawerOnSuccess = () =>
	useEditNoteStore((state) => state.onSuccess);

export const useEditNoteStoreActions = () =>
	useEditNoteStore((state) => state.actions);
