import { z } from "zod";

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

export const transactionIdSchema = z.string().refine(
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
);

export const transactionSchema = z.object({
  id: transactionIdSchema.optional(),
  name: z.string().nullable(),
  notes: z.string().nullable(),
  amount: z.number().refine((value) => value !== 0, {
    message: "Amount cannot be zero",
  }),
  type: z.enum(["BANK", "CASH", "PAYPAL"]),
  createdAt: z.union([z.string(), z.date(), z.undefined()]),
});

export type Transaction = z.infer<typeof transactionSchema>;

export const transactionAllocationSchema = z
  .object({
    id: z.string().cuid2(),
    amount: z.number(),
    appointmentId: z.string().cuid2().nullish(),
    orderId: z.string().cuid2().nullish(),
    customerId: z.string().cuid2(),
    transactionId: transactionIdSchema,
  })
  .refine(
    (data) => {
      const hasAppointment =
        data.appointmentId !== null && data.appointmentId !== undefined;
      const hasOrder = data.orderId !== null && data.orderId !== undefined;
      return !(hasAppointment && hasOrder); // Ensure only one is set
    },
    {
      message:
        "Transaction must be assigned to either an appointment OR an order, not both.",
      path: ["appointmentId", "orderId"], // This points to the relevant fields in the error
    },
  );

export const transactionAllocationFormSchema = (maxAmount: number) => {
  return z
    .object({
      id: z.string().cuid2(),
      amount:
        maxAmount > 0
          ? z
              .number()
              .min(0, {
                message: `Amount has to be between £0 and £${maxAmount}`,
              })
              .max(maxAmount, {
                message: `Amount has to be between £0 and £${maxAmount}`,
              })
          : z
              .number()
              .min(maxAmount, {
                message: `Amount has to be between £${maxAmount} and £0`,
              })
              .max(0, {
                message: `Amount has to be between £${maxAmount} and £0`,
              }),
      appointmentId: z.string().cuid2().nullish(),
      orderId: z.string().cuid2().nullish(),
      customerId: z.string().cuid2(),
      transactionId: transactionIdSchema,
    })
    .refine(
      (data) => {
        const hasAppointment =
          data.appointmentId !== null && data.appointmentId !== undefined;
        const hasOrder = data.orderId !== null && data.orderId !== undefined;
        return !(hasAppointment && hasOrder); // Ensure only one is set
      },
      {
        message:
          "Transaction must be assigned to either an appointment OR an order, not both.",
        path: ["appointmentId", "orderId"], // This points to the relevant fields in the error
      },
    );
};

export type TransactionAllocation = z.infer<typeof transactionAllocationSchema>;

export const appointmentSchema = z.object({
  id: z.string().cuid2().optional(),
  name: z.string(),
  notes: z.string().nullable(),
  startsAt: z.date(),
});

export type Appointment = z.infer<typeof appointmentSchema>;
