import {
  createNote as insertNote,
  deleteNote as removeNote,
  listNotes as fetchNotes,
} from "../../../db/src/repositories/notes"

export async function listNotes(filter: { customerId?: string; appointmentId?: string; hairOrderId?: string }) {
  return fetchNotes(undefined, filter)
}

export async function createNote(input: {
  note: string
  customerId: string
  appointmentId?: string | null
  hairOrderId?: string | null
  createdById: string
}) {
  return insertNote(undefined, input)
}

export async function deleteNote(id: string) {
  return removeNote(undefined, id)
}
