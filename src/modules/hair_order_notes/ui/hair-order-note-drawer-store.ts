import type { HairOrderNote } from "@/lib/schemas";
import { create } from "zustand";

type State = {
	isOpen: boolean;
	hairOrderId: number;
	note: HairOrderNote;
	onCreated?: () => void;
	onUpdated?: () => void;
};

type Action = {
	openDrawer: (data: Partial<State>) => void;
	reset: () => void;
};

const initialState: State = {
	isOpen: false,
	hairOrderId: 0,
	note: { note: "" },
	onCreated: undefined,
	onUpdated: undefined,
};

export const useHairOrderNoteDrawerStore = create<State & Action>((set) => ({
	...initialState,
	openDrawer: (data: Partial<State>) => set(() => ({ ...data, isOpen: true })),
	reset: () => {
		set(initialState);
	},
}));
