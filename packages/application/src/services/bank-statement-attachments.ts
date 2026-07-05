import {
  createBankStatementAttachment as insertBankStatementAttachment,
  assignBankStatementAttachment as patchAssignBankStatementAttachment,
  countBankStatementAttachments as fetchBankStatementAttachmentCounts,
  getBankStatementAttachment as findBankStatementAttachment,
  deleteBankStatementAttachment as removeBankStatementAttachment,
  listBankStatementAttachmentExportRows as fetchBankStatementAttachmentExportRows,
  listBankStatementAttachments as fetchBankStatementAttachments,
  unassignBankStatementAttachment as patchUnassignBankStatementAttachment,
} from "@prive-admin-tanstack/db"

import { notFound, unexpectedError } from "../errors"

export async function listBankStatementAttachments(input: { entryId?: string; assigned?: boolean } = {}) {
  return fetchBankStatementAttachments(undefined, input)
}

export async function countBankStatementAttachments() {
  return fetchBankStatementAttachmentCounts(undefined)
}

export async function createBankStatementAttachment(input: {
  id: string
  bankStatementEntryId: string | null
  r2Key: string
  originalName: string
  contentType: string
  size: number
  uploadedById: string
}) {
  const row = await insertBankStatementAttachment(undefined, input)
  if (!row) throw unexpectedError("Failed to create bank statement attachment")
  return row
}

export async function getBankStatementAttachment(id: string) {
  const row = await findBankStatementAttachment(undefined, id)
  if (!row) throw notFound("Attachment not found")
  return row
}

export async function assignBankStatementAttachment(input: { id: string; entryId: string }) {
  const row = await patchAssignBankStatementAttachment(undefined, input)
  if (!row) throw notFound("Entry not found")
  return row
}

export async function unassignBankStatementAttachment(id: string) {
  const row = await patchUnassignBankStatementAttachment(undefined, id)
  if (!row) throw notFound("Attachment not found")
  return row
}

export async function deleteBankStatementAttachment(id: string) {
  const row = await removeBankStatementAttachment(undefined, id)
  if (!row) throw notFound("Attachment not found")
  return row
}

export async function listBankStatementAttachmentExportRows(input: {
  start: string
  end: string
  bankAccountId?: string
}) {
  return fetchBankStatementAttachmentExportRows(undefined, input)
}
