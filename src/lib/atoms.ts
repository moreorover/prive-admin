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
  onCreated: () => void;
}>({ isOpen: false, onCreated: () => {} });

export const editCustomerDrawerAtom = atom<{
  isOpen: boolean;
  customer: Customer;
  onCreated: () => void;
}>({ isOpen: false, customer: { name: "" }, onCreated: () => {} });

export const newProductDrawerAtom = atom<{
  isOpen: boolean;
  onCreated: () => void;
}>({ isOpen: false, onCreated: () => {} });

export const editProductDrawerAtom = atom<{
  isOpen: boolean;
  product: Product;
  onUpdated: () => void;
}>({
  isOpen: false,
  product: { name: "", description: "" },
  onUpdated: () => {},
});

export const newProductVariantDrawerAtom = atom<{
  isOpen: boolean;
  productId: string;
  onCreated: () => void;
}>({ isOpen: false, productId: "", onCreated: () => {} });

export const editProductVariantDrawerAtom = atom<{
  isOpen: boolean;
  productVariant: ProductVariant;
  onUpdated: () => void;
}>({
  isOpen: false,
  productVariant: { size: "", price: 0, stock: 0 },
  onUpdated: () => {},
});

export const newOrderDrawerAtom = atom<{
  isOpen: boolean;
  customerId: string;
  onCreated: () => void;
}>({ isOpen: false, customerId: "", onCreated: () => {} });

export const editOrderDrawerAtom = atom<{
  isOpen: boolean;
  order: Order;
  onUpdated: () => void;
}>({
  isOpen: false,
  order: {
    customerId: "",
    type: "PURCHASE",
    status: "PENDING",
    placedAt: dayjs().toDate(),
  },
  onUpdated: () => {},
});

export const newOrderItemDrawerAtom = atom<{
  isOpen: boolean;
  orderId: string;
  productOptions: { value: string; label: string }[];
  onCreated: () => void;
}>({ isOpen: false, orderId: "", productOptions: [], onCreated: () => {} });

export const editOrderItemDrawerAtom = atom<{
  isOpen: boolean;
  orderItem: OrderItem;
  productOptions: { value: string; label: string }[];
  onUpdated: () => void;
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
  onUpdated: () => {},
});

export const newTransactionDrawerAtom = atom<{
  isOpen: boolean;
  orderId?: string | null;
  appointmentId?: string | null;
  customerId: string;
  onCreated: () => void;
}>({
  isOpen: false,
  appointmentId: undefined,
  orderId: undefined,
  customerId: "",
  onCreated: () => {},
});

export const editTransactionDrawerAtom = atom<{
  isOpen: boolean;
  transaction: Transaction;
  onUpdated: () => void;
}>({
  isOpen: false,
  transaction: { name: "", notes: "", amount: 0, type: "CASH" },
  onUpdated: () => {},
});

export const newAppointmentDrawerAtom = atom<{
  isOpen: boolean;
  clientId: string;
  onCreated: () => void;
}>({ isOpen: false, clientId: "", onCreated: () => {} });

export const editAppointmentDrawerAtom = atom<{
  isOpen: boolean;
  appointment: Appointment;
}>({
  isOpen: false,
  appointment: { name: "", notes: "", startsAt: dayjs().toDate() },
});

export const personnelPickerModalAtom = atom<{
  isOpen: boolean;
  personnel: Customer[];
  onConfirmAction: (selectedTransactions: string[]) => void;
}>({ isOpen: false, personnel: [], onConfirmAction: () => {} });
