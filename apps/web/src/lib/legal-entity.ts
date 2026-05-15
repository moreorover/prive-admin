const COUNTRIES = ["GB", "LT"] as const
export type Country = (typeof COUNTRIES)[number]

export const COUNTRY_LABELS: Record<Country, string> = {
  GB: "United Kingdom",
  LT: "Lithuania",
}

export const COUNTRY_FLAGS: Record<Country, string> = {
  GB: "🇬🇧",
  LT: "🇱🇹",
}
