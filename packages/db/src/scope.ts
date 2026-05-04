import type { PgColumn } from "drizzle-orm/pg-core"

import { eq } from "drizzle-orm"

export function whereActiveLegalEntity(column: PgColumn, activeLegalEntityId: string | null) {
  return activeLegalEntityId ? eq(column, activeLegalEntityId) : undefined
}
