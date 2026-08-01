import { eq, type AnyColumn } from "drizzle-orm"

export function whereActiveLegalEntity(column: AnyColumn, activeLegalEntityId: string | null) {
  return activeLegalEntityId ? eq(column, activeLegalEntityId) : undefined
}
