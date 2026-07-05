import {
  assignBankStatementAttachment,
  countBankStatementAttachments,
  deleteBankStatementAttachment,
  getBankStatementEntry,
  listBankStatementAttachments,
  unassignBankStatementAttachment,
} from "@prive-admin-tanstack/application/services"
import { z } from "zod"

import { toTrpcError } from "../errors"
import { protectedProcedure, router } from "../index"

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
        await getBankStatementEntry(input.entryId)
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
      return await deleteBankStatementAttachment(input.id)
    } catch (error) {
      throw toTrpcError(error)
    }
  }),
})
