import { z } from "zod";

export const customerSchema = z.object({
	id: z.string().cuid2().optional(),
	name: z
		.string()
		.min(5, { message: "Name must be at least 5 characters long" })
		.max(50, { message: "Name cannot exceed 50 characters" }),
	phoneNumber: z
		.string()
		.min(10, "Phone number must be at least 10 characters long")
		.max(15, "Phone number must be at most 15 characters long")
		.regex(
			/^\+\d+$/,
			"Phone number must start with '+' and contain only digits after it",
		)
		.nullish(),
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

export const transactionSchema = z.object({
	id: z.string().cuid2().optional(),
	name: z.string().nullable(),
	notes: z.string().nullable(),
	amount: z.number().refine((value) => value !== 0, {
		message: "Amount cannot be zero",
	}),
	type: z.enum(["BANK", "CASH", "PAYPAL"]),
	status: z.enum(["PENDING", "COMPLETED"]),
	completedDateBy: z.union([z.string(), z.date()]),
	createdAt: z.union([z.string(), z.date(), z.undefined()]),
});

export type Transaction = z.infer<typeof transactionSchema>;

export const appointmentSchema = z.object({
	id: z.string().cuid2().optional(),
	name: z.string(),
	startsAt: z.date(),
});

export type Appointment = z.infer<typeof appointmentSchema>;

export const appointmentNoteSchema = z.object({
	id: z.string().cuid2().optional(),
	note: z.string(),
});

export type AppointmentNote = z.infer<typeof appointmentNoteSchema>;

export const hairOrderSchema = z.object({
	id: z.number().positive().optional(),
	placedAt: z.union([z.string(), z.date(), z.null()]),
	arrivedAt: z.union([z.string(), z.date(), z.null()]),
	customerId: z.string().cuid2().nullish(),
	weightReceived: z.number(),
	weightUsed: z.number(),
});

export const hairOrderTotalWeightSchema = z.object({
	id: z.number().positive(),
	weightReceived: z.number().positive(),
});

export type HairOrder = z.infer<typeof hairOrderSchema>;

export const hairOrderNoteSchema = z.object({
	id: z.string().cuid2().optional(),
	note: z.string(),
});

export type HairOrderNote = z.infer<typeof hairOrderNoteSchema>;

export const hairSchema = z.object({
	id: z.string().cuid2().optional(),
	color: z.string(),
	description: z.string(),
	upc: z.string(),
	length: z.number().positive().max(150),
	weight: z.number().positive().max(10000),
	price: z.number().default(0),
});

export type Hair = z.infer<typeof hairSchema>;

export const hairComponentSchema = z.object({
	id: z.string().cuid2(),
	hairId: z.string().cuid2(),
	parentId: z.string().cuid2(),
	weight: z.number().positive(),
});

export type HairComponent = z.infer<typeof hairComponentSchema>;

export const hairAssignedToAppointmentShcema = z.object({
	id: z.string().cuid2(),
	hairOrderId: z.number().positive(),
	appointmentId: z.string().cuid2(),
	weightInGrams: z.number().positive(),
});

export type HairAssignedToAppointment = z.infer<
	typeof hairAssignedToAppointmentShcema
>;
