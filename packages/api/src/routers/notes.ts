import { createNote, deleteNote, listNotes } from "@prive-admin-tanstack/application/services"
import { z } from "zod"

import { protectedProcedure, router } from "../index"
import { getOffset, pagedResult, pageSchema } from "../pagination"

const noteSchema = z.object({
  id: z.string().optional(),
  note: z.string().min(1, "Note cannot be empty"),
  customerId: z.string().min(1, "Customer is required"),
  appointmentId: z.string().nullish(),
  hairOrderId: z.string().nullish(),
})

export const notesRouter = router({
  list: protectedProcedure
    .input(
      pageSchema.extend({
        customerId: z.string().optional(),
        appointmentId: z.string().optional(),
        hairOrderId: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      const result = await listNotes({
        pageSize: input.pageSize,
        offset: getOffset(input),
        customerId: input.customerId,
        appointmentId: input.appointmentId,
        hairOrderId: input.hairOrderId,
      })
      return pagedResult(result.items, input, result.totalCount)
    }),

  create: protectedProcedure.input(noteSchema).mutation(async ({ input, ctx }) => {
    return createNote({
      note: input.note,
      customerId: input.customerId,
      appointmentId: input.appointmentId,
      hairOrderId: input.hairOrderId,
      createdById: ctx.session.user.id,
    })
  }),

  delete: protectedProcedure.input(z.object({ id: z.string().min(1) })).mutation(async ({ input }) => {
    await deleteNote(input.id)
  }),
})
