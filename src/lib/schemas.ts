import dayjs from "dayjs";
import { z } from "zod";

const dateSchema = z
	.string({
		required_error: "Date is required",
		invalid_type_error: "Expected a valid date string",
	})
	.refine((value) => !Number.isNaN(Date.parse(value)), {
		message: "Invalid date format",
	})
	.transform((value) => dayjs(value).toISOString());

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

export const transactionSchema = z.object({
	id: z.string().cuid2().optional(),
	name: z.string().nullable(),
	notes: z.string().nullable(),
	amount: z.number().refine((value) => value !== 0, {
		message: "Amount cannot be zero",
	}),
	type: z.enum(["BANK", "CASH", "PAYPAL"]),
	status: z.enum(["PENDING", "COMPLETED"]),
	completedDateBy: z.union([dateSchema, z.date()]),
	createdAt: z.union([z.string(), z.date(), z.undefined()]),
});

export type Transaction = z.infer<typeof transactionSchema>;

export const appointmentSchema = z.object({
	id: z.string().cuid2().optional(),
	name: z.string(),
	startsAt: z.union([dateSchema, z.date()]),
});

export type Appointment = z.infer<typeof appointmentSchema>;

export const appointmentNoteSchema = z.object({
	id: z.string().cuid2().optional(),
	note: z.string(),
});

export type AppointmentNote = z.infer<typeof appointmentNoteSchema>;

export const hairOrderSchema = z.object({
	id: z.string().cuid2().optional(),
	placedAt: z.union([dateSchema, z.null(), z.date()]),
	arrivedAt: z.union([dateSchema, z.null(), z.date()]),
	customerId: z.string().cuid2().nullish(),
	weightReceived: z.number(),
	weightUsed: z.number(),
	total: z.number(),
});

export type HairOrder = z.infer<typeof hairOrderSchema>;

export const hairOrderFormSchema = (minWeight: number) =>
	z.object({
		id: z.string().cuid2().optional(),
		placedAt: z.union([dateSchema, z.null(), z.date()]),
		arrivedAt: z.union([dateSchema, z.null(), z.date()]),
		customerId: z.string().cuid2().nullish(),
		weightReceived: z.number().min(minWeight),
		weightUsed: z.number(),
		total: z.number(),
	});

export const hairOrderNoteSchema = z.object({
	id: z.string().cuid2().optional(),
	note: z.string(),
});

export type HairOrderNote = z.infer<typeof hairOrderNoteSchema>;

export const hairAssignedSchema = z.object({
	id: z.string().cuid2(),
	hairOrderId: z.string().cuid2(),
	appointmentId: z.string().cuid2().nullish(),
	weightInGrams: z.number().positive(),
	soldFor: z.number().positive(),
});

export type HairAssigned = z.infer<typeof hairAssignedSchema>;

export const hairAssignedFormSchema = (maxWeight: number) =>
	z.object({
		id: z.string().cuid2(),
		hairOrderId: z.string().cuid2(),
		appointmentId: z.string().cuid2().nullish(),
		weightInGrams: z.number().positive().max(maxWeight),
		soldFor: z.number().positive(),
	});
