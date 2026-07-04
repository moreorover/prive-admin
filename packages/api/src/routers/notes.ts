import { db } from "@prive-admin-tanstack/db"
import { note } from "@prive-admin-tanstack/db/schema/note"
import { and, eq } from "drizzle-orm"
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
      const conditions = []
      if (input.customerId) conditions.push(eq(note.customerId, input.customerId))
      if (input.appointmentId) conditions.push(eq(note.appointmentId, input.appointmentId))
      if (input.hairOrderId) conditions.push(eq(note.hairOrderId, input.hairOrderId))

      return db.query.note.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        with: { createdBy: true },
        orderBy: (note, { desc }) => [desc(note.createdAt)],
      })
    }),

  create: protectedProcedure.input(noteSchema).mutation(async ({ input, ctx }) => {
    const [result] = await db
      .insert(note)
      .values({
        note: input.note,
        customerId: input.customerId,
        appointmentId: input.appointmentId,
        hairOrderId: input.hairOrderId,
        createdById: ctx.session.user.id,
      })
      .returning()
    return result
  }),

  delete: protectedProcedure.input(z.object({ id: z.string().min(1) })).mutation(async ({ input }) => {
    await db.delete(note).where(eq(note.id, input.id))
  }),
})
