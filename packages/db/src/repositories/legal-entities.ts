import { asc, count, eq } from "drizzle-orm"

import { db, type Db } from "../index"
import { legalEntity } from "../schema/legal-entity"

export type LegalEntityUpsertInput = {
  id?: string
  name: string
  registrationNumber?: string | null
  vatNumber?: string | null
}

export async function listLegalEntities(database: Db = db, input: { pageSize: number; offset: number }) {
  const items = await database.query.legalEntity.findMany({
    orderBy: (le) => [asc(le.country), asc(le.name)],
    limit: input.pageSize,
    offset: input.offset,
  })

  const [countRow] = await database.select({ totalCount: count() }).from(legalEntity)
  return { items, totalCount: countRow?.totalCount ?? 0 }
}

export async function getLegalEntity(database: Db = db, id: string) {
  return database.query.legalEntity.findFirst({
    where: eq(legalEntity.id, id),
    with: {
      bankAccounts: { orderBy: (a) => [asc(a.displayName)] },
    },
  })
}

export async function updateLegalEntity(
  database: Db = db,
  input: Required<Pick<LegalEntityUpsertInput, "id">> & LegalEntityUpsertInput,
) {
  const [result] = await database
    .update(legalEntity)
    .set({
      name: input.name,
      registrationNumber: input.registrationNumber ?? null,
      vatNumber: input.vatNumber ?? null,
    })
    .where(eq(legalEntity.id, input.id))
    .returning()
  return result
}
