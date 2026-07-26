import { and, count, desc, eq } from "drizzle-orm"

import { db, type Db } from "../index"
import { note } from "../schema/note"

export type NoteListFilter = {
  pageSize: number
  offset: number
  customerId?: string
  appointmentId?: string
  hairOrderId?: string
}

export type NoteInput = {
  id?: string
  note: string
  customerId: string
  appointmentId?: string | null
  hairOrderId?: string | null
  createdById: string
}

export async function listNotes(database: Db = db, filter: NoteListFilter) {
  const conditions = []
  if (filter.customerId) conditions.push(eq(note.customerId, filter.customerId))
  if (filter.appointmentId) conditions.push(eq(note.appointmentId, filter.appointmentId))
  if (filter.hairOrderId) conditions.push(eq(note.hairOrderId, filter.hairOrderId))
  const where = conditions.length > 0 ? and(...conditions) : undefined

  const items = await database.query.note.findMany({
    where,
    with: { createdBy: true },
    orderBy: (n) => [desc(n.createdAt)],
    limit: filter.pageSize,
    offset: filter.offset,
  })

  const [countRow] = await database.select({ totalCount: count() }).from(note).where(where)
  return { items, totalCount: countRow?.totalCount ?? 0 }
}

export async function createNote(database: Db = db, input: NoteInput) {
  const [result] = await database
    .insert(note)
    .values({
      note: input.note,
      customerId: input.customerId,
      appointmentId: input.appointmentId ?? null,
      hairOrderId: input.hairOrderId ?? null,
      createdById: input.createdById,
    })
    .returning()
  return result
}

export async function deleteNote(database: Db = db, id: string) {
  return database.delete(note).where(eq(note.id, id))
}
