import { eq } from "drizzle-orm"
import type { PgColumn } from "drizzle-orm/pg-core"

export function whereActiveLegalEntity(column: PgColumn, activeLegalEntityId: string | null) {
  return activeLegalEntityId ? eq(column, activeLegalEntityId) : undefined
}
