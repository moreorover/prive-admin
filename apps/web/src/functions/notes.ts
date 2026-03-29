import { db } from "@prive-admin-tanstack/db"
import { note } from "@prive-admin-tanstack/db/schema/note"
import { createServerFn } from "@tanstack/react-start"
import { and, eq } from "drizzle-orm"
import { z } from "zod"

import { noteSchema } from "@/lib/schemas"
import { requireAuthMiddleware } from "@/middleware/auth"

export const getNotes = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .inputValidator(
    z.object({
      customerId: z.string().optional(),
      appointmentId: z.string().optional(),
      hairOrderId: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const conditions = []
    if (data.customerId) conditions.push(eq(note.customerId, data.customerId))
    if (data.appointmentId) conditions.push(eq(note.appointmentId, data.appointmentId))
    if (data.hairOrderId) conditions.push(eq(note.hairOrderId, data.hairOrderId))

    return db.query.note.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: { createdBy: true },
      orderBy: (note, { desc }) => [desc(note.createdAt)],
    })
  })

export const createNote = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator(noteSchema)
  .handler(async ({ data, context }) => {
    const [result] = await db
      .insert(note)
      .values({
        note: data.note,
        customerId: data.customerId,
        appointmentId: data.appointmentId,
        hairOrderId: data.hairOrderId,
        createdById: context.session.user.id,
      })
      .returning()
    return result
  })

export const updateNote = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator(noteSchema.required({ id: true }))
  .handler(async ({ data }) => {
    const [result] = await db.update(note).set({ note: data.note }).where(eq(note.id, data.id!)).returning()
    return result
  })

export const deleteNote = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    await db.delete(note).where(eq(note.id, data.id))
  })
