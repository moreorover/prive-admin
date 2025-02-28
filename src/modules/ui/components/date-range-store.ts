import { create } from "zustand";

type State = {
  isOpen: boolean;
};

type Action = {
  open: () => void;
  close: () => void;
};

const initialState: State = {
  isOpen: false,
};

export const useDateRangeStore = create<State & Action>((set, get) => ({
  ...initialState,
  isOpen: false,
  open: () => set(() => ({ isOpen: true })),
  close: () => set(() => ({ isOpen: false })),
}));
