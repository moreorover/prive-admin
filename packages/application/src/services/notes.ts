import { createNote as insertNote, deleteNote as removeNote, listNotes as fetchNotes } from "@prive-admin-tanstack/db"

import { unexpectedError } from "../errors"

export async function listNotes(filter: {
  pageSize: number
  offset: number
  customerId?: string
  appointmentId?: string
  hairOrderId?: string
}) {
  return fetchNotes(undefined, filter)
}

export async function createNote(input: {
  note: string
  customerId: string
  appointmentId?: string | null
  hairOrderId?: string | null
  createdById: string
}) {
  let result
  try {
    result = await insertNote(undefined, input)
  } catch (error) {
    throw unexpectedError("Failed to create note", error)
  }

  if (!result) {
    throw unexpectedError("Failed to create note")
  }

  return result
}

export async function deleteNote(id: string) {
  return removeNote(undefined, id)
}
