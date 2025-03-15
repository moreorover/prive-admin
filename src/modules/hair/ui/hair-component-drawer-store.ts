import { create } from "zustand";
import { HairComponent } from "@/lib/schemas";

type State = {
  isOpen: boolean;
  hairComponent: HairComponent;
  maxWeight: number;
  onUpdated?: () => void;
};

type Action = {
  openDrawer: (data: Partial<State>) => void;
  reset: () => void;
};

const initialState: State = {
  isOpen: false,
  hairComponent: { id: "", hairId: "", parentId: "", weight: 0 },
  maxWeight: 0,
  onUpdated: undefined,
};

export const useHairComponentDrawerStore = create<State & Action>((set) => ({
  ...initialState,
  openDrawer: (data: Partial<State>) => set(() => ({ ...data, isOpen: true })),
  reset: () => {
    set(initialState);
  },
}));
