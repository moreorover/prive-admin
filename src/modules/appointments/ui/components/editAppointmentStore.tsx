import { create } from "zustand";

type State = {
	isOpen: boolean;
	appointmentId: string | null;
	onUpdated: () => void;
};

type Actions = {
	openEditAppointmentDrawer(data: Partial<State>): void;
	reset(): void;
};

const initialState: State = {
	isOpen: false,
	appointmentId: null,
	onUpdated: () => {},
};

const useEditAppointmentStore = create<State & { actions: Actions }>((set) => ({
	...initialState,
	actions: {
		openEditAppointmentDrawer: (data: Partial<State>) =>
			set(() => ({ ...data, isOpen: true })),
		reset: () => {
			set(initialState);
		},
	},
}));

export const useEditAppointmentStoreDrawerIsOpen = () =>
	useEditAppointmentStore((state) => state.isOpen);

export const useEditAppointmentStoreDrawerAppointmentId = () =>
	useEditAppointmentStore((state) => state.appointmentId);

export const useEditAppointmentStoreDrawerOnUpdated = () =>
	useEditAppointmentStore((state) => state.onUpdated);

export const useEditAppointmentStoreActions = () =>
	useEditAppointmentStore((state) => state.actions);
