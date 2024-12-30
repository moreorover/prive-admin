import { atom } from "jotai";

export const newCustomerDrawerAtom = atom<{
  isOpen: boolean;
}>({ isOpen: false });
