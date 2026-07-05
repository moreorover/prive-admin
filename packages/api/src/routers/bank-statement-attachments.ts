import {
  assignBankStatementAttachment,
  countBankStatementAttachments,
  deleteBankStatementAttachmentFile,
  listBankStatementAttachments,
  unassignBankStatementAttachment,
} from "@prive-admin-tanstack/application/services"
import { z } from "zod"

import { toTrpcError } from "../errors"
import { protectedProcedure, router } from "../index"
import { r2Storage } from "../storage"

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

  counts: protectedProcedure.query(async () => {
    try {
      return await countBankStatementAttachments()
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
      return await deleteBankStatementAttachmentFile(input.id, r2Storage)
    } catch (error) {
      throw toTrpcError(error)
    }
  }),
})
