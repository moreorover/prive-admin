import { create } from "zustand";
import { Hair } from "@/lib/schemas";

type State = {
  isOpen: boolean;
  hairOrderId: string;
  hair: Hair;
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
  hair: { color: "", description: "", upc: "", length: 0, weight: 0 },
  onCreated: undefined,
  onUpdated: undefined,
};

export const useHairDrawerStore = create<State & Action>((set) => ({
  ...initialState,
  openDrawer: (data: Partial<State>) => set(() => ({ ...data, isOpen: true })),
  reset: () => {
    set(initialState);
  },
}));
