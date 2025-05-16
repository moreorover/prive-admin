import { create } from "zustand";

type State = {
	isOpen: boolean;
	appointmentId: string | null;
	onSuccess: () => void;
};

type Actions = {
	openEditAppointmentDrawer(data: Partial<State>): void;
	reset(): void;
};

const initialState: State = {
	isOpen: false,
	appointmentId: null,
	onSuccess: () => {},
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

export const useEditAppointmentStoreDrawerOnSuccess = () =>
	useEditAppointmentStore((state) => state.onSuccess);

export const useEditAppointmentStoreActions = () =>
	useEditAppointmentStore((state) => state.actions);
