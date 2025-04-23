import type { AppointmentNote } from "@/lib/schemas";
import { create } from "zustand";

type State = {
	isOpen: boolean;
	appointmentId: string;
	note: AppointmentNote;
	onCreated?: () => void;
	onUpdated?: () => void;
};

type Action = {
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

export const useAppointmentNoteDrawerStore = create<State & Action>((set) => ({
	...initialState,
	openDrawer: (data: Partial<State>) => set(() => ({ ...data })),
	reset: () => {
		set(initialState);
	},
}));
