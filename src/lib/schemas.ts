import { z } from "zod";

export type ActionResponse = {
  type: "SUCCESS" | "ERROR";
  message: string;
};

export const customerSchema = z.object({
  id: z.string().cuid2().optional(),
  name: z
    .string()
    .min(5, { message: "Name must be at least 5 characters long" })
    .max(50, { message: "Name cannot exceed 50 characters" }),
});

export type Customer = z.infer<typeof customerSchema>;

export const productSchema = z.object({
  id: z.string().cuid2().optional(),
  name: z
    .string()
    .min(5, { message: "Name must be at least 5 characters long" })
    .max(50, { message: "Name cannot exceed 50 characters" }),
  description: z.string().nullish(),
});

export type Product = z.infer<typeof productSchema>;

export const productVariantSchema = z.object({
  id: z.string().cuid2().optional(),
  productId: z.string().cuid2(),
  size: z.string(),
  price: z.number(),
  stock: z.number(),
});

export type ProductVariant = z.infer<typeof productVariantSchema>;

export const orderSchema = z.object({
  id: z.string().cuid2().optional(),
  customerId: z.string().cuid2(),
  status: z.enum(["PENDING", "COMPLETED", "CANCELLED"]),
  type: z.enum(["PURCHASE", "SALE"]),
  placedAt: z.date(),
});

export type Order = z.infer<typeof orderSchema>;

export const orderItemSchema = z.object({
  id: z.string().cuid2().optional(),
  orderId: z.string().cuid2(),
  productVariantId: z.string().cuid2(),
  quantity: z.number(),
  unitPrice: z.number(),
  totalPrice: z.number(),
});

export type OrderItem = z.infer<typeof orderItemSchema>;

export const transactionSchema = z.object({
  id: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val) return true; // Allow undefined
        // Check if it's a valid cuid2 or starts with "mm_"
        return (
          z.string().cuid2().safeParse(val).success ||
          val.startsWith("mm_") ||
          val.startsWith("pp_")
        );
      },
      { message: "id must be a valid cuid2 or start with 'mm_'" },
    ),
  name: z.string().nullable(),
  notes: z.string().nullable(),
  amount: z.number(),
  type: z.enum(["BANK", "CASH", "PAYPAL"]),
  orderId: z.string().cuid2().nullish(),
  customerId: z.string().cuid2().nullish(),
});

export const transactionsSchema = z.array(transactionSchema);

export type Transaction = z.infer<typeof transactionSchema>;
