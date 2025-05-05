import type { AppointmentNote } from "@/lib/schemas";
import { create } from "zustand";

type State = {
	isOpen: boolean;
	appointmentId: string;
	note: AppointmentNote;
	onCreated?: () => void;
	onUpdated?: () => void;
};

type Actions = {
	openDrawer: (data: Partial<State>) => void;
	reset: () => void;
};

const initialState: State = {
	isOpen: false,
	appointmentId: "",
	note: { note: "" },
	onCreated: undefined,
	onUpdated: undefined,
};

type Store = State & { actions: Actions };

const useAppointmentNoteDrawerStore = create<Store>((set) => ({
	...initialState,
	actions: {
		openDrawer: (data: Partial<State>) =>
			set(() => ({ ...data, isOpen: true })),
		reset: () => {
			set(initialState);
		},
	},
}));

export const useAppointmentNoteDrawerStoreIsOpen = () =>
	useAppointmentNoteDrawerStore((state) => state.isOpen);

export const useAppointmentNoteDrawerStoreAppointmentId = () =>
	useAppointmentNoteDrawerStore((state) => state.appointmentId);

export const useAppointmentNoteDrawerStoreNote = () =>
	useAppointmentNoteDrawerStore((state) => state.note);

export const useAppointmentNoteDrawerStoreActions = () =>
	useAppointmentNoteDrawerStore((state) => state.actions);

export const useAppointmentNoteDrawerStoreOnUpdated = () =>
	useAppointmentNoteDrawerStore((state) => state.onUpdated);

export const useAppointmentNoteDrawerStoreOnCreated = () =>
	useAppointmentNoteDrawerStore((state) => state.onCreated);
