import { db } from "@prive-admin-tanstack/db"
import { legalEntity } from "@prive-admin-tanstack/db/schema/legal-entity"
import { createServerFn } from "@tanstack/react-start"
import { eq } from "drizzle-orm"
import { z } from "zod"

import { legalEntityUpdateSchema } from "@/lib/schemas"
import { requireAuthMiddleware } from "@/middleware/auth"

export const listLegalEntities = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .handler(async () => {
    return db.query.legalEntity.findMany({
      orderBy: (le, { asc }) => [asc(le.country), asc(le.name)],
    })
  })

export const getLegalEntity = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .inputValidator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    const row = await db.query.legalEntity.findFirst({ where: eq(legalEntity.id, data.id) })
    if (!row) throw new Error("Legal entity not found")
    return row
  })

export const updateLegalEntity = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator(legalEntityUpdateSchema)
  .handler(async ({ data }) => {
    const [row] = await db
      .update(legalEntity)
      .set({
        name: data.name,
        registrationNumber: data.registrationNumber ?? null,
        vatNumber: data.vatNumber ?? null,
      })
      .where(eq(legalEntity.id, data.id))
      .returning()
    if (!row) throw new Error("Legal entity not found")
    return row
  })
