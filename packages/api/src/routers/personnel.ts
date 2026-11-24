import { createPersonnel, listPersonnel } from "@prive-admin-tanstack/application/services"
import { z } from "zod"

import { toTrpcError } from "../errors"
import { ownerProcedure, protectedProcedure, router } from "../index"
import { getOffset, pagedResult, pageSchema, searchSchema } from "../pagination"

export const personnelRouter = router({
  create: ownerProcedure
    .input(z.object({ customerId: z.string().min(1), type: z.enum(["master", "assistant"]) }))
    .mutation(async ({ input }) => {
      try {
        return await createPersonnel(input)
      } catch (error) {
        throw toTrpcError(error)
      }
    }),
  list: protectedProcedure
    .input(
      pageSchema.extend({
        search: searchSchema,
        activeOnly: z.boolean().optional(),
        type: z.enum(["master", "assistant"]).optional(),
      }),
    )
    .query(async ({ input }) => {
      try {
        const result = await listPersonnel({
          pageSize: input.pageSize,
          offset: getOffset(input),
          search: input.search,
          activeOnly: input.activeOnly,
          type: input.type,
        })
        return pagedResult(result.items, input, result.totalCount)
      } catch (error) {
        throw toTrpcError(error)
      }
    }),
})
