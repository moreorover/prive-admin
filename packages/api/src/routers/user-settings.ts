import { db } from "@prive-admin-tanstack/db"
import { userSettings } from "@prive-admin-tanstack/db/schema/user-settings"
import { TRPCError } from "@trpc/server"
import { eq } from "drizzle-orm"
import { z } from "zod"

import { protectedProcedure, router } from "../index"

const currencySchema = z.enum(["GBP", "EUR"])

export const userSettingsRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id
    const row = await db.query.userSettings.findFirst({
      where: eq(userSettings.userId, userId),
    })
    if (row) {
      return { userId: row.userId, preferredCurrency: row.preferredCurrency }
    }
    return { userId, preferredCurrency: "EUR" as const }
  }),

  update: protectedProcedure.input(z.object({ preferredCurrency: currencySchema })).mutation(async ({ ctx, input }) => {
    const userId = ctx.session.user.id
    const [row] = await db
      .insert(userSettings)
      .values({ userId, preferredCurrency: input.preferredCurrency })
      .onConflictDoUpdate({
        target: userSettings.userId,
        set: { preferredCurrency: input.preferredCurrency },
      })
      .returning()
    if (!row) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to update user settings" })
    }
    return { userId: row.userId, preferredCurrency: row.preferredCurrency }
  }),
})
