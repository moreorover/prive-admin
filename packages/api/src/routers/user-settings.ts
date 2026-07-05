import { z } from "zod"

import { getUserSettings, updateUserSettings } from "../../../application/src/services/user-settings"
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
