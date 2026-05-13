import { db } from "@prive-admin-tanstack/db"
import { salon } from "@prive-admin-tanstack/db/schema/salon"
import { createServerFn } from "@tanstack/react-start"
import { eq } from "drizzle-orm"
import { z } from "zod"

import { salonSchema } from "@/lib/schemas"
import { requireAuthMiddleware } from "@/middleware/auth"

export const listSalons = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .handler(async () => {
    return db.query.salon.findMany({
      orderBy: (s, { asc }) => [asc(s.name)],
    })
  })

export const getSalon = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .inputValidator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    const row = await db.query.salon.findFirst({ where: eq(salon.id, data.id) })
    if (!row) throw new Error("Salon not found")
    return row
  })

export const createSalon = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator(salonSchema)
  .handler(async ({ data }) => {
    const [row] = await db
      .insert(salon)
      .values({ name: data.name, address: data.address ?? null })
      .returning()
    return row
  })

export const updateSalon = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator(salonSchema.required({ id: true }))
  .handler(async ({ data }) => {
    const [row] = await db
      .update(salon)
      .set({ name: data.name, address: data.address ?? null })
      .where(eq(salon.id, data.id!))
      .returning()
    if (!row) throw new Error("Salon not found")
    return row
  })
