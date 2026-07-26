import { getLegalEntity, listLegalEntities, updateLegalEntity } from "@prive-admin-tanstack/application/services"
import { z } from "zod"

import { toTrpcError } from "../errors"
import { protectedProcedure, router } from "../index"
import { getOffset, pagedResult, pageSchema } from "../pagination"

const legalEntityUpdateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, "Name is required").max(120),
  registrationNumber: z.string().max(40).nullish(),
  vatNumber: z.string().max(40).nullish(),
})

export const legalEntitiesRouter = router({
  list: protectedProcedure.input(pageSchema).query(async ({ input }) => {
    const result = await listLegalEntities({ pageSize: input.pageSize, offset: getOffset(input) })
    return pagedResult(result.items, input, result.totalCount)
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
