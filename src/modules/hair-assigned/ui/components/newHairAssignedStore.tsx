import { create } from "zustand";

type State = {
	isOpen: boolean;
	relations: {
		appointmentId?: string | null | undefined;
		clientId: string | null;
	};
	onSuccess: () => void;
};

type Actions = {
	openNewHairAssignedDrawer(data: Partial<State>): void;
	reset(): void;
};

const initialState: State = {
	isOpen: false,
	relations: {
		clientId: null,
	},
	onSuccess: async () => {},
};

const useNewHairAssignedStore = create<State & { actions: Actions }>((set) => ({
	...initialState,
	actions: {
		openNewHairAssignedDrawer: (data: Partial<State>) =>
			set(() => ({ ...data, isOpen: true })),
		reset: () => {
			set(initialState);
		},
	},
}));

export const useNewHairAssignedStoreDrawerIsOpen = () =>
	useNewHairAssignedStore((state) => state.isOpen);

export const useNewHairAssignedStoreDrawerRelations = () =>
	useNewHairAssignedStore((state) => state.relations);

export const useNewHairAssignedStoreDrawerOnSuccess = () =>
	useNewHairAssignedStore((state) => state.onSuccess);

export const useNewHairAssignedStoreActions = () =>
	useNewHairAssignedStore((state) => state.actions);
