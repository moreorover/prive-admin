import { create } from "zustand";

type State = {
	isOpen: boolean;
	relations: { clientId: string };
	onSuccess: () => void;
};

type Actions = {
	openNewAppointmentDrawer(data: Partial<State>): void;
	reset(): void;
};

const initialState: State = {
	isOpen: false,
	relations: { clientId: "" },
	onSuccess: () => {},
};

const useNewAppointmentStore = create<State & { actions: Actions }>((set) => ({
	...initialState,
	actions: {
		openNewAppointmentDrawer: (data: Partial<State>) =>
			set(() => ({ ...data, isOpen: true })),
		reset: () => {
			set(initialState);
		},
	},
}));

export const useNewAppointmentStoreDrawerIsOpen = () =>
	useNewAppointmentStore((state) => state.isOpen);

export const useNewAppointmentStoreDrawerRelations = () =>
	useNewAppointmentStore((state) => state.relations);

export const useNewAppointmentStoreDrawerOnSuccess = () =>
	useNewAppointmentStore((state) => state.onSuccess);

export const useNewAppointmentStoreActions = () =>
	useNewAppointmentStore((state) => state.actions);
