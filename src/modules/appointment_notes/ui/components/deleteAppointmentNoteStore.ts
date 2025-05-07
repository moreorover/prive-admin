import { create } from "zustand";

type State = {
	isOpen: boolean;
	appointmentNoteId: string | null;
	onSuccess: () => void;
};

type Actions = {
	openDeleteAppointmentNoteDrawer(data: Partial<State>): void;
	reset(): void;
};

const initialState: State = {
	isOpen: false,
	appointmentNoteId: null,
	onSuccess: () => {},
};

const useDeleteAppointmentNoteStore = create<State & { actions: Actions }>(
	(set) => ({
		...initialState,
		actions: {
			openDeleteAppointmentNoteDrawer: (data: Partial<State>) =>
				set(() => ({ ...data, isOpen: true })),
			reset: () => {
				set(initialState);
			},
		},
	}),
);

export const useDeleteAppointmentNoteStoreDrawerIsOpen = () =>
	useDeleteAppointmentNoteStore((state) => state.isOpen);

export const useDeleteAppointmentNoteStoreDrawerAppointmentNoteId = () =>
	useDeleteAppointmentNoteStore((state) => state.appointmentNoteId);

export const useDeleteAppointmentNoteStoreDrawerOnSuccess = () =>
	useDeleteAppointmentNoteStore((state) => state.onSuccess);

export const useDeleteAppointmentNoteStoreActions = () =>
	useDeleteAppointmentNoteStore((state) => state.actions);
