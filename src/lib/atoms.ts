import { atom } from "jotai";
import { Customer, Product, ProductVariant } from "@/lib/schemas";

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

export const newProductVariantDrawerAtom = atom<{
  isOpen: boolean;
  productId: string;
}>({ isOpen: false, productId: "" });

export const editProductVariantDrawerAtom = atom<{
  isOpen: boolean;
  productVariant: ProductVariant;
}>({
  isOpen: false,
  productVariant: { productId: "", size: "", price: 0, stock: 0 },
});
