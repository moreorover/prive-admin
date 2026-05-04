import { db } from "@prive-admin-tanstack/db"
import { legalEntity } from "@prive-admin-tanstack/db/schema/legal-entity"
import { salon } from "@prive-admin-tanstack/db/schema/salon"
import { createServerFn } from "@tanstack/react-start"
import { eq } from "drizzle-orm"
import { z } from "zod"

import { countrySchema } from "@/lib/legal-entity"
import { salonSchema } from "@/lib/schemas"
import { requireAuthMiddleware } from "@/middleware/auth"

async function assertLegalEntityCountry(legalEntityId: string, country: string) {
  const le = await db.query.legalEntity.findFirst({
    where: eq(legalEntity.id, legalEntityId),
    columns: { id: true, country: true },
  })
  if (!le) throw new Error("Default legal entity not found")
  if (le.country !== country) {
    throw new Error("Salon country must match the default legal entity's country")
  }
}

export const listSalons = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .handler(async () => {
    return db.query.salon.findMany({
      with: { defaultLegalEntity: true },
      orderBy: (s, { asc }) => [asc(s.country), asc(s.name)],
    })
  })

export const listSalonsByCountry = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .inputValidator(z.object({ country: countrySchema }))
  .handler(async ({ data }) => {
    return db.query.salon.findMany({
      where: eq(salon.country, data.country),
      orderBy: (s, { asc }) => [asc(s.name)],
    })
  })

export const getSalon = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .inputValidator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    const row = await db.query.salon.findFirst({
      where: eq(salon.id, data.id),
      with: { defaultLegalEntity: true },
    })
    if (!row) throw new Error("Salon not found")
    return row
  })

export const createSalon = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator(salonSchema)
  .handler(async ({ data }) => {
    await assertLegalEntityCountry(data.defaultLegalEntityId, data.country)
    const [row] = await db
      .insert(salon)
      .values({
        name: data.name,
        country: data.country,
        defaultLegalEntityId: data.defaultLegalEntityId,
        address: data.address ?? null,
      })
      .returning()
    return row
  })

export const updateSalon = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator(salonSchema.required({ id: true }))
  .handler(async ({ data }) => {
    await assertLegalEntityCountry(data.defaultLegalEntityId, data.country)
    const [row] = await db
      .update(salon)
      .set({
        name: data.name,
        country: data.country,
        defaultLegalEntityId: data.defaultLegalEntityId,
        address: data.address ?? null,
      })
      .where(eq(salon.id, data.id!))
      .returning()
    if (!row) throw new Error("Salon not found")
    return row
  })
