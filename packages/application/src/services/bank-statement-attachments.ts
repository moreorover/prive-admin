import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3"
import {
  createBankStatementAttachment as insertBankStatementAttachment,
  assignBankStatementAttachment as patchAssignBankStatementAttachment,
  countBankStatementAttachments as fetchBankStatementAttachmentCounts,
  getBankStatementAttachment as findBankStatementAttachment,
  getBankStatementEntry as findBankStatementEntry,
  listAssignedBankStatementAttachments as fetchAssignedBankStatementAttachments,
  deleteBankStatementAttachment as removeBankStatementAttachment,
  listBankStatementAttachmentExportRows as fetchBankStatementAttachmentExportRows,
  listBankStatementAttachments as fetchBankStatementAttachments,
  unassignBankStatementAttachment as patchUnassignBankStatementAttachment,
} from "@prive-admin-tanstack/db"
import * as archiverPkg from "archiver"
import { randomUUID } from "node:crypto"
import { Readable } from "node:stream"

import { notFound, unexpectedError } from "../errors"
import { bucketName, r2 } from "../r2"

const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024
const INLINE_SAFE_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "text/plain",
  "text/csv",
])

const ZipArchive = (
  archiverPkg as unknown as {
    ZipArchive: new (opts?: unknown) => Readable & {
      append: (src: Readable | Buffer, opts: { name: string }) => void
      finalize: () => void
      on: (ev: string, cb: (err: Error) => void) => void
    }
  }
).ZipArchive

export async function listBankStatementAttachments(input: { entryId?: string; assigned?: boolean } = {}) {
  return fetchBankStatementAttachments(undefined, input)
}

export async function listAssignedBankStatementAttachments(input: {
  legalEntityId: string
  pageSize: number
  offset: number
}) {
  return fetchAssignedBankStatementAttachments(undefined, input)
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

export async function uploadBankStatementAttachment(input: {
  entryId: string | null
  fileName: string
  contentType: string
  size: number
  uploadedById: string
  body: Uint8Array
}) {
  if (input.size > MAX_ATTACHMENT_BYTES) {
    throw new Error(`File exceeds ${MAX_ATTACHMENT_BYTES} bytes`)
  }

  if (input.entryId) {
    const entry = await findBankStatementEntry(undefined, input.entryId)
    if (!entry) throw notFound("Statement entry not found")
  }

  const safeName = input.fileName.replace(/[^\w.-]+/g, "_")
  const now = new Date()
  const yyyy = now.getUTCFullYear()
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0")
  const attachmentId = randomUUID()
  const key = `statement_uploads/${yyyy}/${mm}/${attachmentId}-${safeName}`

  try {
    await r2.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: input.body,
        ContentType: input.contentType,
      }),
    )
  } catch (error) {
    throw unexpectedError("Failed to upload bank statement attachment", error)
  }

  const row = await insertBankStatementAttachment(undefined, {
    id: attachmentId,
    bankStatementEntryId: input.entryId,
    r2Key: key,
    originalName: input.fileName,
    contentType: input.contentType,
    size: input.size,
    uploadedById: input.uploadedById,
  })
  if (!row) throw unexpectedError("Failed to create bank statement attachment")
  return row
}

export async function getBankStatementAttachment(id: string) {
  const row = await findBankStatementAttachment(undefined, id)
  if (!row) throw notFound("Attachment not found")
  return row
}

export async function getBankStatementAttachmentPreview(id: string) {
  const row = await getBankStatementAttachment(id)
  const object = await r2.send(new GetObjectCommand({ Bucket: bucketName, Key: row.r2Key }))
  return { row, body: object.Body ?? null }
}

export async function getBankStatementAttachmentPreviewResponse(id: string) {
  const preview = await getBankStatementAttachmentPreview(id)
  if (!preview.body) throw new Error("Empty body")

  const contentType = preview.row.contentType || "application/octet-stream"
  const disposition = INLINE_SAFE_TYPES.has(contentType) ? "inline" : "attachment"
  const filename = encodeURIComponent(preview.row.originalName)

  return new Response(Readable.toWeb(preview.body as Readable) as unknown as ReadableStream, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `${disposition}; filename="${filename}"; filename*=UTF-8''${filename}`,
      "Cache-Control": "private, max-age=60",
      "X-Content-Type-Options": "nosniff",
    },
  })
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

export async function deleteBankStatementAttachmentFile(id: string) {
  const row = await getBankStatementAttachment(id)
  try {
    await r2.send(new DeleteObjectCommand({ Bucket: bucketName, Key: row.r2Key }))
  } catch (error) {
    throw unexpectedError("Failed to delete bank statement attachment file", error)
  }

  await deleteBankStatementAttachment(id)
  return row
}

export async function listBankStatementAttachmentExportRows(input: {
  start: string
  end: string
  bankAccountId?: string
}) {
  return fetchBankStatementAttachmentExportRows(undefined, input)
}

export async function listBankStatementAttachmentExportFiles(input: {
  start: string
  end: string
  bankAccountId?: string
}) {
  const rows = await listBankStatementAttachmentExportRows(input)
  const files: Array<{ name: string; body: Readable | Buffer }> = []
  for (const { attachment, entry } of rows) {
    const object = await r2.send(new GetObjectCommand({ Bucket: bucketName, Key: attachment.r2Key }))
    const body = object.Body as Readable | Buffer | null | undefined
    if (!body) continue
    const counterparty = (entry.counterpartyName ?? "").replace(/[^\w.-]+/g, "_").slice(0, 60) || "unknown"
    files.push({
      name: `${entry.date}_${counterparty}_${attachment.originalName}`,
      body,
    })
  }
  return files
}

function pad2(n: number) {
  return String(n).padStart(2, "0")
}

function lastDay(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

export async function exportBankStatementAttachmentsResponse(input: {
  year: number
  month: number
  bankAccountId?: string
}) {
  const start = `${input.year}-${pad2(input.month)}-01`
  const end = `${input.year}-${pad2(input.month)}-${pad2(lastDay(input.year, input.month))}`
  const files = await listBankStatementAttachmentExportFiles({ start, end, bankAccountId: input.bankAccountId })

  const archive = new ZipArchive({ zlib: { level: 9 } })
  archive.on("warning", (err: Error) => console.warn("[zip warning]", err))
  archive.on("error", (err: Error) => console.error("[zip error]", err))

  for (const file of files) {
    archive.append(file.body as Readable, { name: file.name })
  }

  archive.finalize()

  const webStream = Readable.toWeb(archive) as unknown as ReadableStream
  const filename = `bank-statements-${input.year}-${pad2(input.month)}.zip`

  return new Response(webStream, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
}
