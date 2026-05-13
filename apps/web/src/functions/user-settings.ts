import { db } from "@prive-admin-tanstack/db"
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
      return { userId: row.userId, preferredCurrency: row.preferredCurrency }
    }
    return { userId, preferredCurrency: "GBP" as const }
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
    return { userId: row.userId, preferredCurrency: row.preferredCurrency }
  })
