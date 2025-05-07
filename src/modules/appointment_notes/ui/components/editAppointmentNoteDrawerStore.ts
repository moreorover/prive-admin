import { create } from "zustand";

type State = {
	isOpen: boolean;
	appointmentNoteId: string | null;
	onSuccess?: () => void;
};

type Actions = {
	openEditAppointmentNoteDrawer(data: Partial<State>): void;
	reset(): void;
};

const initialState: State = {
	isOpen: false,
	appointmentNoteId: null,
	onSuccess: undefined,
};

const useAppointmentNoteDrawerStore = create<State & { actions: Actions }>(
	(set) => ({
		...initialState,
		actions: {
			openEditAppointmentNoteDrawer: (data: Partial<State>) =>
				set(() => ({ ...data, isOpen: true })),
			reset: () => {
				set(initialState);
			},
		},
	}),
);

export const useEditAppointmentNoteStoreDrawerIsOpen = () =>
	useAppointmentNoteDrawerStore((state) => state.isOpen);

export const useEditAppointmentNoteStoreDrawerAppointmentNoteId = () =>
	useAppointmentNoteDrawerStore((state) => state.appointmentNoteId);

export const useEditAppointmentNoteStoreDrawerOnSuccess = () =>
	useAppointmentNoteDrawerStore((state) => state.onSuccess);

export const useEditAppointmentNoteStoreActions = () =>
	useAppointmentNoteDrawerStore((state) => state.actions);
