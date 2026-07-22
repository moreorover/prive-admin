import { currencySchema } from "@prive-admin-tanstack/ui/lib/currency"
import { z } from "zod"

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
