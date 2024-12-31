import { atom } from "jotai";
import { Customer, Product } from "@/lib/schemas";

export const newCustomerDrawerAtom = atom<{
  isOpen: boolean;
}>({ isOpen: false });

export const editCustomerDrawerAtom = atom<{
  isOpen: boolean;
  customer: Customer;
}>({ isOpen: false, customer: { name: "" } });

export const newProductDrawerAtom = atom<{
  isOpen: boolean;
}>({ isOpen: false });

export const editProductDrawerAtom = atom<{
  isOpen: boolean;
  product: Product;
}>({ isOpen: false, product: { name: "", description: "" } });
