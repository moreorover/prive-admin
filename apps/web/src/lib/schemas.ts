import { z } from "zod"

import { currencySchema } from "./currency"

const pgIntegerSchema = z.number().int().min(-2147483648).max(2147483647)

export const customerSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(5, "Name must be at least 5 characters long").max(50, "Name cannot exceed 50 characters"),
  phoneNumber: z
    .string()
    .min(10, "Phone number must be at least 10 characters long")
    .max(15, "Phone number must be at most 15 characters long")
    .regex(/^\+\d+$/, "Phone number must start with '+' and contain only digits after it")
    .nullish(),
})

export const appointmentSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  startsAt: z.union([z.string(), z.date()]),
  clientId: z.string().min(1, "Client is required"),
  masterId: z.string().min(1, "Master is required"),
  salonId: z.string().min(1, "Salon is required"),
})

export const hairOrderSchema = z.object({
  id: z.string().optional(),
  placedAt: z.union([z.string(), z.date(), z.null()]),
  arrivedAt: z.union([z.string(), z.date(), z.null()]),
  customerId: z.string().min(1, "Customer is required"),
  status: z.enum(["PENDING", "COMPLETED"]).default("PENDING"),
  weightReceived: z.number().min(0),
  weightUsed: z.number().min(0),
  total: z.number().min(0),
})

export const noteSchema = z.object({
  id: z.string().optional(),
  note: z.string().min(1, "Note cannot be empty"),
  customerId: z.string().min(1, "Customer is required"),
  appointmentId: z.string().nullish(),
  hairOrderId: z.string().nullish(),
})

export const legalEntityUpdateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, "Name is required").max(120),
  registrationNumber: z.string().max(40).nullish(),
  vatNumber: z.string().max(40).nullish(),
})

export const salonSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required").max(120),
  address: z.string().max(255).nullish(),
})

export const bankAccountSchema = z.object({
  id: z.string().optional(),
  legalEntityId: z.string().min(1, "Legal entity is required"),
  iban: z
    .string()
    .min(15, "IBAN looks too short")
    .max(34, "IBAN looks too long")
    .regex(/^[A-Z]{2}\d{2}[A-Z0-9]+$/, "Invalid IBAN format"),
  currency: currencySchema,
  bankName: z.string().max(120).nullish(),
  swift: z.string().max(11).nullish(),
  displayName: z.string().min(1, "Display name is required").max(120),
})

export const cashTransactionSchema = z.object({
  id: z.string().optional(),
  customerId: z.string().min(1, "Customer is required"),
  createdAt: z.iso.date("Date is required"),
  description: z.string().max(120).nullish(),
  notes: z.string().max(1000).nullish(),
  amount: pgIntegerSchema.refine((value) => value !== 0, "Amount cannot be zero"),
  currency: currencySchema.default("EUR"),
})
