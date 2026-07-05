import { createSalon, getSalon, listSalons, updateSalon } from "@prive-admin-tanstack/application/services"
import { z } from "zod"

import { toTrpcError } from "../errors"
import { protectedProcedure, router } from "../index"

const salonSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required").max(120),
  address: z.string().max(255).nullish(),
})

export const salonsRouter = router({
  list: protectedProcedure.input(z.object({}).optional().default({})).query(() => {
    return listSalons()
  }),

  get: protectedProcedure.input(z.object({ id: z.string().min(1) })).query(async ({ input }) => {
    try {
      return await getSalon(input.id)
    } catch (error) {
      throw toTrpcError(error)
    }
  }),

  create: protectedProcedure.input(salonSchema).mutation(async ({ input }) => {
    return createSalon({ name: input.name, address: input.address })
  }),

  update: protectedProcedure.input(salonSchema.required({ id: true })).mutation(async ({ input }) => {
    try {
      return await updateSalon({ id: input.id, name: input.name, address: input.address })
    } catch (error) {
      throw toTrpcError(error)
    }
  }),
})
