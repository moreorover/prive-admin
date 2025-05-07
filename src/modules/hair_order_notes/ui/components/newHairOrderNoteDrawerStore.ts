import { create } from "zustand";

type State = {
	isOpen: boolean;
	relations: { hairOrderId: string };
	onSuccess?: () => void;
};

type Actions = {
	openNewHairOrderNoteDrawer(data: Partial<State>): void;
	reset(): void;
};

const initialState: State = {
	isOpen: false,
	relations: { hairOrderId: "" },
	onSuccess: undefined,
};

const useHairOrderNoteDrawerStore = create<State & { actions: Actions }>(
	(set) => ({
		...initialState,
		actions: {
			openNewHairOrderNoteDrawer: (data: Partial<State>) =>
				set(() => ({ ...data, isOpen: true })),
			reset: () => {
				set(initialState);
			},
		},
	}),
);

export const useNewHairOrderNoteStoreDrawerIsOpen = () =>
	useHairOrderNoteDrawerStore((state) => state.isOpen);

export const useNewHairOrderNoteStoreDrawerRelations = () =>
	useHairOrderNoteDrawerStore((state) => state.relations);

export const useNewHairOrderNoteStoreDrawerOnSuccess = () =>
	useHairOrderNoteDrawerStore((state) => state.onSuccess);

export const useNewHairOrderNoteStoreActions = () =>
	useHairOrderNoteDrawerStore((state) => state.actions);
