import {
  assignBankStatementAttachment,
  countBankStatementAttachments,
  deleteBankStatementAttachmentFile,
  getBankStatementAttachment,
  listBankStatementAttachments,
  unassignBankStatementAttachment,
} from "@prive-admin-tanstack/application/services"
import { z } from "zod"

import { toTrpcError } from "../errors"
import { protectedProcedure, router } from "../index"
import { getOffset, pagedResult, pageSchema } from "../pagination"

export const bankStatementAttachmentsRouter = router({
  list: protectedProcedure
    .input(
      pageSchema.extend({
        assignmentStatus: z.enum(["assigned", "unassigned", "all"]).default("all"),
        entryId: z.string().min(1).optional(),
        legalEntityId: z.string().min(1).optional(),
      }),
    )
    .query(async ({ input }) => {
      try {
        const result = await listBankStatementAttachments({
          assignmentStatus: input.assignmentStatus,
          ...(input.entryId ? { entryId: input.entryId } : {}),
          ...(input.legalEntityId ? { legalEntityId: input.legalEntityId } : {}),
          pageSize: input.pageSize,
          offset: getOffset(input),
        })
        return pagedResult(result.items, input, result.totalCount)
      } catch (error) {
        throw toTrpcError(error)
      }
    }),

  counts: protectedProcedure.query(async () => {
    try {
      return await countBankStatementAttachments()
    } catch (error) {
      throw toTrpcError(error)
    }
  }),

  get: protectedProcedure.input(z.object({ id: z.string().min(1) })).query(async ({ input }) => {
    try {
      return await getBankStatementAttachment(input.id)
    } catch (error) {
      throw toTrpcError(error)
    }
  }),

  assign: protectedProcedure
    .input(z.object({ id: z.string().min(1), entryId: z.string().min(1) }))
    .mutation(async ({ input }) => {
      try {
        return await assignBankStatementAttachment({ id: input.id, entryId: input.entryId })
      } catch (error) {
        throw toTrpcError(error)
      }
    }),

  unassign: protectedProcedure.input(z.object({ id: z.string().min(1) })).mutation(async ({ input }) => {
    try {
      return await unassignBankStatementAttachment(input.id)
    } catch (error) {
      throw toTrpcError(error)
    }
  }),

  delete: protectedProcedure.input(z.object({ id: z.string().min(1) })).mutation(async ({ input }) => {
    try {
      return await deleteBankStatementAttachmentFile(input.id)
    } catch (error) {
      throw toTrpcError(error)
    }
  }),
})
