import { db } from "@prive-admin-tanstack/db"
import { legalEntity } from "@prive-admin-tanstack/db/schema/legal-entity"
import { userSettings } from "@prive-admin-tanstack/db/schema/user-settings"
import { createServerFn } from "@tanstack/react-start"
import { eq } from "drizzle-orm"
import { z } from "zod"

import { currencySchema } from "@/lib/currency"
import { requireAuthMiddleware } from "@/middleware/auth"

export const getUserSettings = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .handler(async ({ context }) => {
    const userId = context.session.user.id
    const row = await db.query.userSettings.findFirst({
      where: eq(userSettings.userId, userId),
    })
    if (row) {
      return {
        userId: row.userId,
        preferredCurrency: row.preferredCurrency,
        activeLegalEntityId: row.activeLegalEntityId,
      }
    }
    return { userId, preferredCurrency: "GBP" as const, activeLegalEntityId: null }
  })

export const updateUserSettings = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator(z.object({ preferredCurrency: currencySchema }))
  .handler(async ({ context, data }) => {
    const userId = context.session.user.id
    const [row] = await db
      .insert(userSettings)
      .values({ userId, preferredCurrency: data.preferredCurrency })
      .onConflictDoUpdate({
        target: userSettings.userId,
        set: { preferredCurrency: data.preferredCurrency },
      })
      .returning()
    return {
      userId: row.userId,
      preferredCurrency: row.preferredCurrency,
      activeLegalEntityId: row.activeLegalEntityId,
    }
  })

export const setActiveLegalEntity = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator(z.object({ legalEntityId: z.string().min(1).nullable() }))
  .handler(async ({ context, data }) => {
    const userId = context.session.user.id

    if (data.legalEntityId !== null) {
      const exists = await db.query.legalEntity.findFirst({
        where: eq(legalEntity.id, data.legalEntityId),
        columns: { id: true },
      })
      if (!exists) {
        throw new Error("Legal entity not found")
      }
    }

    const [row] = await db
      .insert(userSettings)
      .values({
        userId,
        preferredCurrency: "GBP",
        activeLegalEntityId: data.legalEntityId,
      })
      .onConflictDoUpdate({
        target: userSettings.userId,
        set: { activeLegalEntityId: data.legalEntityId },
      })
      .returning()
    return { activeLegalEntityId: row.activeLegalEntityId }
  })
