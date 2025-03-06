import { create } from "zustand";
import { HairOrderNote } from "@/lib/schemas";

type State = {
  isOpen: boolean;
  hairOrderId: string;
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
  hairOrderId: "",
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
