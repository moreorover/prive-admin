import { atom } from "jotai";
import {
  Appointment,
  Customer,
  Order,
  OrderItem,
  Product,
  ProductVariant,
  Transaction,
} from "@/lib/schemas";
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
  order: {
    customerId: "",
    type: "PURCHASE",
    status: "PENDING",
    placedAt: dayjs().toDate(),
  },
});

export const newOrderItemDrawerAtom = atom<{
  isOpen: boolean;
  orderId: string;
  productOptions: { value: string; label: string }[];
}>({ isOpen: false, orderId: "", productOptions: [] });

export const editOrderItemDrawerAtom = atom<{
  isOpen: boolean;
  orderItem: OrderItem;
  productOptions: { value: string; label: string }[];
}>({
  isOpen: false,
  orderItem: {
    orderId: "",
    quantity: 0,
    totalPrice: 0,
    unitPrice: 0,
    productVariantId: "",
  },
  productOptions: [],
});

export const newTransactionDrawerAtom = atom<{
  isOpen: boolean;
  orderId?: string | null;
  customerId?: string | null;
}>({ isOpen: false, orderId: undefined, customerId: undefined });

export const editTransactionDrawerAtom = atom<{
  isOpen: boolean;
  transaction: Transaction;
}>({
  isOpen: false,
  transaction: {
    name: "",
    notes: "",
    amount: 0,
    type: "CASH",
    orderId: null,
    customerId: null,
  },
});

export const transactionPickerModalAtom = atom<{
  isOpen: boolean;
}>({ isOpen: false });

export const newAppointmentDrawerAtom = atom<{
  isOpen: boolean;
  clientId: string;
}>({ isOpen: false, clientId: "" });

export const editAppointmentDrawerAtom = atom<{
  isOpen: boolean;
  appointment: Appointment;
}>({
  isOpen: false,
  appointment: { name: "", notes: "", startsAt: dayjs().toDate() },
});

export const personnelPickerModalAtom = atom<{
  isOpen: boolean;
}>({ isOpen: false });
