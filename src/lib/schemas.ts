import { z } from "zod";

export type ActionResponse = {
  type: "SUCCESS" | "ERROR";
  message: string;
};

export const customerSchema = z.object({
  id: z.string().cuid().optional(),
  name: z
    .string()
    .min(5, { message: "Name must be at least 5 characters long" })
    .max(50, { message: "Name cannot exceed 50 characters" }),
});

export type Customer = z.infer<typeof customerSchema>;

export const productSchema = z.object({
  id: z.string().cuid().optional(),
  name: z
    .string()
    .min(5, { message: "Name must be at least 5 characters long" })
    .max(50, { message: "Name cannot exceed 50 characters" }),
  description: z.string(),
});

export type Product = z.infer<typeof productSchema>;

export const productVariantSchema = z.object({
  id: z.string().cuid().optional(),
  productId: z.string().cuid(),
  size: z.string(),
  price: z.number(),
  stock: z.number(),
});

export type ProductVariant = z.infer<typeof productVariantSchema>;

export const orderSchema = z.object({
  id: z.string().cuid().optional(),
  customerId: z.string().cuid(),
  status: z.enum(["PENDING", "COMPLETED", "CANCELLED"]),
  type: z.enum(["PURCHASE", "SALE"]),
  placedAt: z.date(),
});

export type Order = z.infer<typeof orderSchema>;

export const orderItemSchema = z.object({
  id: z.string().cuid().optional(),
  orderId: z.string().cuid(),
  productVariantId: z.string().cuid(),
  quantity: z.number(),
  unitPrice: z.number(),
  totalPrice: z.number(),
});

export type OrderItem = z.infer<typeof orderItemSchema>;

export const transactionSchema = z.object({
  id: z.string().cuid().optional(),
  name: z.string(),
  type: z.enum(["BANK", "CASH"]),
  direction: z.enum(["IN", "OUT"]),
  orderId: z.string().cuid(),
  total: z.number(),
  isProductCost: z.boolean(),
});

export type Transaction = z.infer<typeof transactionSchema>;
