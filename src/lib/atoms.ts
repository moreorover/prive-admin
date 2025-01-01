import { atom } from "jotai";
import { Customer, Order, Product, ProductVariant } from "@/lib/schemas";
import dayjs from "dayjs";

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

export const newOrderDrawerAtom = atom<{
  isOpen: boolean;
  customerId: string;
}>({ isOpen: false, customerId: "" });

export const editOrderDrawerAtom = atom<{
  isOpen: boolean;
  order: Order;
}>({
  isOpen: false,
  order: { customerId: "", status: "PENDING", placedAt: dayjs().toDate() },
});
