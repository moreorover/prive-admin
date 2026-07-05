import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3"
import { createId } from "@paralleldrive/cuid2"
import {
  createBankStatementAttachment,
  getBankStatementAttachment,
  getBankStatementEntry,
  listBankStatementAttachmentExportRows,
} from "@prive-admin-tanstack/application/services"
import * as archiverPkg from "archiver"
import { Hono } from "hono"
import { Readable } from "node:stream"

import { bucketName, r2 } from "../r2"
import { requireSession } from "./session"

const ZipArchive = (
  archiverPkg as unknown as {
    ZipArchive: new (opts?: unknown) => Readable & {
      append: (src: Readable | Buffer, opts: { name: string }) => void
      finalize: () => void
      on: (ev: string, cb: (err: Error) => void) => void
    }
  }
).ZipArchive

const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024

function pad2(n: number) {
  return String(n).padStart(2, "0")
}

function lastDay(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

function safeSegment(s: string | null | undefined) {
  if (!s) return ""
  return s.replace(/[^\w.-]+/g, "_").slice(0, 60)
}

export const statementAttachmentRoutes = new Hono()

statementAttachmentRoutes.post("/upload", async (c) => {
  const session = await requireSession(c.req.raw)
  if (!session) return c.json({ error: "Unauthorized" }, 401)

  const formData = await c.req.raw.formData()
  const rawEntryId = formData.get("entryId")
  const entryId = typeof rawEntryId === "string" && rawEntryId.length > 0 ? rawEntryId : null
  const file = formData.get("file") as globalThis.File | null

  if (!file) return c.json({ error: "No file provided" }, 400)
  if (file.size > MAX_ATTACHMENT_BYTES) return c.json({ error: `File exceeds ${MAX_ATTACHMENT_BYTES} bytes` }, 413)

  if (entryId) {
    try {
      await getBankStatementEntry(entryId)
    } catch {
      return c.json({ error: "Entry not found" }, 404)
    }
  }

  const safeName = file.name.replace(/[^\w.-]+/g, "_")
  const now = new Date()
  const yyyy = now.getUTCFullYear()
  const mm = pad2(now.getUTCMonth() + 1)
  const attachmentId = createId()
  const key = `statement_uploads/${yyyy}/${mm}/${attachmentId}-${safeName}`
  const arrayBuffer = await file.arrayBuffer()

  try {
    await r2.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: new Uint8Array(arrayBuffer),
        ContentType: file.type || "application/octet-stream",
      }),
    )
  } catch (error) {
    console.error("[statement-attachment upload] R2", error)
    return c.json({ error: "Upload failed" }, 500)
  }

  let row
  try {
    row = await createBankStatementAttachment({
      id: attachmentId,
      bankStatementEntryId: entryId,
      r2Key: key,
      originalName: file.name,
      contentType: file.type || "application/octet-stream",
      size: file.size,
      uploadedById: session.user.id,
    })
  } catch (error) {
    console.error("[statement-attachment upload] db", error)
    return c.json({ error: "Upload failed" }, 500)
  }

  return c.json(row)
})

statementAttachmentRoutes.get("/preview", async (c) => {
  const session = await requireSession(c.req.raw)
  if (!session) return c.json({ error: "Unauthorized" }, 401)

  const id = c.req.query("id")
  if (!id) return c.json({ error: "Missing id" }, 400)

  let row
  try {
    row = await getBankStatementAttachment(id)
  } catch {
    return c.json({ error: "Not found" }, 404)
  }

  let obj
  try {
    obj = await r2.send(new GetObjectCommand({ Bucket: bucketName, Key: row.r2Key }))
  } catch (error) {
    console.error("[statement-attachment preview] R2", error)
    return c.json({ error: "Fetch failed" }, 500)
  }
  if (!obj.Body) return c.json({ error: "Empty body" }, 500)

  const webStream = Readable.toWeb(obj.Body as Readable) as unknown as ReadableStream
  const inlineSafeTypes = new Set([
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "text/plain",
    "text/csv",
  ])
  const contentType = row.contentType || "application/octet-stream"
  const disposition = inlineSafeTypes.has(contentType) ? "inline" : "attachment"
  const filename = encodeURIComponent(row.originalName)

  return new Response(webStream, {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `${disposition}; filename="${filename}"; filename*=UTF-8''${filename}`,
      "Cache-Control": "private, max-age=60",
      "X-Content-Type-Options": "nosniff",
    },
  })
})

statementAttachmentRoutes.get("/export", async (c) => {
  const session = await requireSession(c.req.raw)
  if (!session) return c.json({ error: "Unauthorized" }, 401)

  const year = Number(c.req.query("year"))
  const month = Number(c.req.query("month"))
  const bankAccountId = c.req.query("bankAccountId") || undefined

  if (!Number.isInteger(year) || year < 2000 || year > 9999) return c.json({ error: "Invalid year" }, 400)
  if (!Number.isInteger(month) || month < 1 || month > 12) return c.json({ error: "Invalid month" }, 400)

  const start = `${year}-${pad2(month)}-01`
  const end = `${year}-${pad2(month)}-${pad2(lastDay(year, month))}`

  const rows = await listBankStatementAttachmentExportRows({ start, end, bankAccountId })

  const archive = new ZipArchive({ zlib: { level: 9 } })
  archive.on("warning", (err: Error) => console.warn("[zip warning]", err))
  archive.on("error", (err: Error) => console.error("[zip error]", err))

  for (const { attachment, entry } of rows) {
    const obj = await r2.send(new GetObjectCommand({ Bucket: bucketName, Key: attachment.r2Key }))
    const body = obj.Body
    if (!body) continue
    const counterparty = safeSegment(entry.counterpartyName) || "unknown"
    const name = `${entry.date}_${counterparty}_${attachment.originalName}`
    archive.append(body as Readable, { name })
  }

  archive.finalize()

  const webStream = Readable.toWeb(archive) as unknown as ReadableStream
  const filename = `bank-statements-${year}-${pad2(month)}.zip`

  return new Response(webStream, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  })
})
