import { z } from "zod"

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

export type CustomerInput = z.infer<typeof customerSchema>

export const appointmentSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  startsAt: z.union([z.string(), z.date()]),
  clientId: z.string().min(1, "Client is required"),
  salonId: z.string().min(1, "Salon is required"),
})
export type AppointmentInput = z.infer<typeof appointmentSchema>

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
export type HairOrderInput = z.infer<typeof hairOrderSchema>

export const noteSchema = z.object({
  id: z.string().optional(),
  note: z.string().min(1, "Note cannot be empty"),
  customerId: z.string().min(1, "Customer is required"),
  appointmentId: z.string().nullish(),
  hairOrderId: z.string().nullish(),
})

export type NoteInput = z.infer<typeof noteSchema>

export const legalEntityUpdateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, "Name is required").max(120),
  registrationNumber: z.string().max(40).nullish(),
  vatNumber: z.string().max(40).nullish(),
})
export type LegalEntityUpdateInput = z.infer<typeof legalEntityUpdateSchema>

export const salonSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required").max(120),
  address: z.string().max(255).nullish(),
})
export type SalonInput = z.infer<typeof salonSchema>
