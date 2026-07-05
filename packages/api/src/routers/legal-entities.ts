import {
  getLegalEntity,
  listLegalEntities,
  updateLegalEntity,
} from "@prive-admin-tanstack/application/services/legal-entities"
import { z } from "zod"

import { toTrpcError } from "../errors"
import { protectedProcedure, router } from "../index"

const legalEntityUpdateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, "Name is required").max(120),
  registrationNumber: z.string().max(40).nullish(),
  vatNumber: z.string().max(40).nullish(),
})

export const legalEntitiesRouter = router({
  list: protectedProcedure.input(z.object({}).optional().default({})).query(() => {
    return listLegalEntities()
  }),

  get: protectedProcedure.input(z.object({ id: z.string().min(1) })).query(async ({ input }) => {
    try {
      return await getLegalEntity(input.id)
    } catch (error) {
      throw toTrpcError(error)
    }
  }),

  update: protectedProcedure.input(legalEntityUpdateSchema).mutation(async ({ input }) => {
    try {
      return await updateLegalEntity({
        id: input.id,
        name: input.name,
        registrationNumber: input.registrationNumber,
        vatNumber: input.vatNumber,
      })
    } catch (error) {
      throw toTrpcError(error)
    }
  }),
})
