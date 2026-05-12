import { z } from "zod"

export const COUNTRIES = ["GB", "LT"] as const
export type Country = (typeof COUNTRIES)[number]
export const countrySchema = z.enum(COUNTRIES)

export const LEGAL_ENTITY_TYPES = ["LTD", "IV", "MB"] as const
export type LegalEntityType = (typeof LEGAL_ENTITY_TYPES)[number]
export const legalEntityTypeSchema = z.enum(LEGAL_ENTITY_TYPES)

export const COUNTRY_LABELS: Record<Country, string> = {
  GB: "United Kingdom",
  LT: "Lithuania",
}

export const COUNTRY_FLAGS: Record<Country, string> = {
  GB: "🇬🇧",
  LT: "🇱🇹",
}
