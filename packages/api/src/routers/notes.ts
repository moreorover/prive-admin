import { createNote, deleteNote, listNotes } from "@prive-admin-tanstack/application/services/notes"
import { z } from "zod"

import { protectedProcedure, router } from "../index"

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
      z.object({
        customerId: z.string().optional(),
        appointmentId: z.string().optional(),
        hairOrderId: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      return listNotes({
        customerId: input.customerId,
        appointmentId: input.appointmentId,
        hairOrderId: input.hairOrderId,
      })
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
