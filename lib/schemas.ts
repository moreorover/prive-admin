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

export const createCustomerSchema = customerSchema.pick({ name: true });

export type Customer = z.infer<typeof customerSchema>;

export type CreateCustomer = z.infer<typeof createCustomerSchema>;

export const productSchema = z.object({
  id: z.string().cuid().optional(),
  name: z
    .string()
    .min(5, { message: "Name must be at least 5 characters long" })
    .max(50, { message: "Name cannot exceed 50 characters" }),
  description: z.string(),
});

export const createProductSchema = productSchema.pick({
  name: true,
  description: true,
});

export type Product = z.infer<typeof productSchema>;
