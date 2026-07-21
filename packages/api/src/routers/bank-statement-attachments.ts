import {
  assignBankStatementAttachment,
  countBankStatementAttachments,
  deleteBankStatementAttachmentFile,
  getBankStatementAttachment,
  listAssignedBankStatementAttachments,
  listBankStatementAttachments,
  listGlobalBankStatementAttachments,
  unassignBankStatementAttachment,
} from "@prive-admin-tanstack/application/services"
import { z } from "zod"

import { toTrpcError } from "../errors"
import { protectedProcedure, router } from "../index"
import { getOffset, pagedResult, pageSchema } from "../pagination"

export const bankStatementAttachmentsRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        entryId: z.string().min(1).optional(),
        assigned: z.boolean().optional(),
      }),
    )
    .query(async ({ input }) => {
      try {
        return await listBankStatementAttachments(input)
      } catch (error) {
        throw toTrpcError(error)
      }
    }),

  listAssigned: protectedProcedure
    .input(
      pageSchema.extend({
        legalEntityId: z.string().min(1),
      }),
    )
    .query(async ({ input }) => {
      try {
        const result = await listAssignedBankStatementAttachments({
          legalEntityId: input.legalEntityId,
          pageSize: input.pageSize,
          offset: getOffset(input),
        })
        return pagedResult(result.items, input, result.totalCount)
      } catch (error) {
        throw toTrpcError(error)
      }
    }),

  listGlobal: protectedProcedure
    .input(
      pageSchema.extend({
        status: z.enum(["assigned", "unassigned", "all"]).default("unassigned"),
      }),
    )
    .query(async ({ input }) => {
      try {
        const result = await listGlobalBankStatementAttachments({
          status: input.status,
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
