import { create } from "zustand";

type State = {
	isOpen: boolean;
	relations: { appointmentId: string };
	onSuccess?: () => void;
};

type Actions = {
	openNewAppointmentNoteDrawer(data: Partial<State>): void;
	reset(): void;
};

const initialState: State = {
	isOpen: false,
	relations: { appointmentId: "" },
	onSuccess: undefined,
};

const useAppointmentNoteDrawerStore = create<State & { actions: Actions }>(
	(set) => ({
		...initialState,
		actions: {
			openNewAppointmentNoteDrawer: (data: Partial<State>) =>
				set(() => ({ ...data, isOpen: true })),
			reset: () => {
				set(initialState);
			},
		},
	}),
);

export const useNewAppointmentNoteStoreDrawerIsOpen = () =>
	useAppointmentNoteDrawerStore((state) => state.isOpen);

export const useNewAppointmentNoteStoreDrawerRelations = () =>
	useAppointmentNoteDrawerStore((state) => state.relations);

export const useNewAppointmentNoteStoreDrawerOnSuccess = () =>
	useAppointmentNoteDrawerStore((state) => state.onSuccess);

export const useNewAppointmentNoteStoreActions = () =>
	useAppointmentNoteDrawerStore((state) => state.actions);
