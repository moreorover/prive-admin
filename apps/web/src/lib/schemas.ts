import { z } from "zod"

import { currencySchema } from "./currency"

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
  salonId: z.string().min(1, "Salon is required"),
})

export const hairOrderSchema = z.object({
  id: z.string().optional(),
  placedAt: z.union([z.string(), z.date(), z.null()]),
  arrivedAt: z.union([z.string(), z.date(), z.null()]),
  customerId: z.string().min(1, "Customer is required"),
  legalEntityId: z.string().min(1, "Legal entity is required"),
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
