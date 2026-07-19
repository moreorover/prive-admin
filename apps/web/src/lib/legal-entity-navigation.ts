export type LegalEntitySectionValue = "overview" | "documents" | "bank-accounts" | "salons"

export type LegalEntitySection = {
  value: LegalEntitySectionValue
  label: string
}

export const LEGAL_ENTITY_SECTIONS = [
  { value: "overview", label: "Overview" },
  { value: "documents", label: "Documents" },
  { value: "bank-accounts", label: "Bank accounts" },
  { value: "salons", label: "Salons" },
] as const satisfies readonly LegalEntitySection[]

const SECTION_VALUES = new Set<LegalEntitySectionValue>(LEGAL_ENTITY_SECTIONS.map((section) => section.value))

export function getLegalEntitySectionFromPath(pathname: string): LegalEntitySectionValue {
  const match = pathname.match(/^\/legal-entities\/[^/]+(?:\/([^/]+))?/)
  const section = match?.[1] as LegalEntitySectionValue | undefined

  return section && SECTION_VALUES.has(section) ? section : "overview"
}

export function getLegalEntitySectionPath(
  legalEntityId: string,
  section: LegalEntitySectionValue,
): `/legal-entities/${string}/${LegalEntitySectionValue}` {
  return `/legal-entities/${legalEntityId}/${section}`
}
