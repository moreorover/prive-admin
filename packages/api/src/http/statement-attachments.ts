import {
  exportBankStatementAttachmentsResponse,
  getBankStatementAttachmentPreviewResponse,
  uploadBankStatementAttachment,
} from "@prive-admin-tanstack/application/services"
import { Hono } from "hono"

import { requireSession } from "./session"

export const statementAttachmentRoutes = new Hono()

statementAttachmentRoutes.post("/upload", async (c) => {
  const session = await requireSession(c.req.raw)
  if (!session) return c.json({ error: "Unauthorized" }, 401)

  const formData = await c.req.raw.formData()
  const rawEntryId = formData.get("entryId")
  const entryId = typeof rawEntryId === "string" && rawEntryId.length > 0 ? rawEntryId : null
  const file = formData.get("file") as globalThis.File | null

  if (!file) return c.json({ error: "No file provided" }, 400)

  try {
    const row = await uploadBankStatementAttachment({
      entryId,
      fileName: file.name,
      contentType: file.type || "application/octet-stream",
      size: file.size,
      uploadedById: session.user.id,
      body: new Uint8Array(await file.arrayBuffer()),
    })
    return c.json(row)
  } catch (error) {
    console.error("[statement-attachment upload]", error)
    return c.json({ error: "Upload failed" }, 500)
  }
})

statementAttachmentRoutes.get("/preview", async (c) => {
  const session = await requireSession(c.req.raw)
  if (!session) return c.json({ error: "Unauthorized" }, 401)

  const id = c.req.query("id")
  if (!id) return c.json({ error: "Missing id" }, 400)

  try {
    return await getBankStatementAttachmentPreviewResponse(id)
  } catch {
    return c.json({ error: "Not found" }, 404)
  }
})

statementAttachmentRoutes.get("/export", async (c) => {
  const session = await requireSession(c.req.raw)
  if (!session) return c.json({ error: "Unauthorized" }, 401)

  const year = Number(c.req.query("year"))
  const month = Number(c.req.query("month"))
  const bankAccountId = c.req.query("bankAccountId") || undefined

  if (!Number.isInteger(year) || year < 2000 || year > 9999) return c.json({ error: "Invalid year" }, 400)
  if (!Number.isInteger(month) || month < 1 || month > 12) return c.json({ error: "Invalid month" }, 400)

  try {
    return await exportBankStatementAttachmentsResponse({ year, month, bankAccountId })
  } catch (error) {
    console.error("[statement-attachment export]", error)
    return c.json({ error: "Export failed" }, 500)
  }
})
