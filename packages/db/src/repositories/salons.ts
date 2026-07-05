import { asc, eq } from "drizzle-orm"

import { db, type Db } from "../index"
import { salon } from "../schema/salon"

export type SalonUpsertInput = {
  id?: string
  name: string
  address?: string | null
}

export async function listSalons(database: Db = db) {
  return database.query.salon.findMany({
    orderBy: (s) => [asc(s.name)],
  })
}

export async function getSalon(database: Db = db, id: string) {
  return database.query.salon.findFirst({ where: eq(salon.id, id) })
}

export async function createSalon(database: Db = db, input: SalonUpsertInput) {
  const [result] = await database
    .insert(salon)
    .values({ name: input.name, address: input.address ?? null })
    .returning()
  return result
}

export async function updateSalon(database: Db = db, input: Required<Pick<SalonUpsertInput, "id">> & SalonUpsertInput) {
  const [result] = await database
    .update(salon)
    .set({ name: input.name, address: input.address ?? null })
    .where(eq(salon.id, input.id))
    .returning()
  return result
}
