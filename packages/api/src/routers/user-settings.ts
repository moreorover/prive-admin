import { getUserSettings, updateUserSettings } from "@prive-admin-tanstack/application/services/user-settings"
import { z } from "zod"

import { protectedProcedure, router } from "../index"

const currencySchema = z.enum(["GBP", "EUR"])

export const userSettingsRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    return getUserSettings(ctx.session.user.id)
  }),

  update: protectedProcedure.input(z.object({ preferredCurrency: currencySchema })).mutation(async ({ ctx, input }) => {
    return updateUserSettings(ctx.session.user.id, input.preferredCurrency)
  }),
})
