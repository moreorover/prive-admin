import { create } from "zustand";

type State = {
	isOpen: boolean;
	relations: {
		appointmentId?: string | null | undefined;
		hairOrderId?: string | null | undefined;
		customerId: string;
	};
	onSuccess: () => void;
};

type Actions = {
	openNewNoteDrawer(data: Partial<State>): void;
	reset(): void;
};

const initialState: State = {
	isOpen: false,
	relations: {
		customerId: "",
	},
	onSuccess: async () => {},
};

const useNewNoteStore = create<State & { actions: Actions }>((set) => ({
	...initialState,
	actions: {
		openNewNoteDrawer: (data: Partial<State>) =>
			set(() => ({ ...data, isOpen: true })),
		reset: () => {
			set(initialState);
		},
	},
}));

export const useNewNoteStoreDrawerIsOpen = () =>
	useNewNoteStore((state) => state.isOpen);

export const useNewNoteStoreDrawerRelations = () =>
	useNewNoteStore((state) => state.relations);

export const useNewNoteStoreDrawerOnSuccess = () =>
	useNewNoteStore((state) => state.onSuccess);

export const useNewNoteStoreActions = () =>
	useNewNoteStore((state) => state.actions);
