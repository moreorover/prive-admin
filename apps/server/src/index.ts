import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3"
import { serve } from "@hono/node-server"
import { trpcServer } from "@hono/trpc-server"
import { createId } from "@paralleldrive/cuid2"
import { createContext } from "@prive-admin-tanstack/api/context"
import { bucketName, r2 } from "@prive-admin-tanstack/api/r2"
import { appRouter } from "@prive-admin-tanstack/api/routers"
import { auth } from "@prive-admin-tanstack/auth"
import { db } from "@prive-admin-tanstack/db"
import { bankStatementAttachment } from "@prive-admin-tanstack/db/schema/bank-statement-attachment"
import { bankStatementEntry } from "@prive-admin-tanstack/db/schema/bank-statement-entry"
import { env } from "@prive-admin-tanstack/env/server"
import * as archiverPkg from "archiver"
import { and, eq, gte, lte } from "drizzle-orm"
import { Hono } from "hono"
import { cors } from "hono/cors"
import { logger } from "hono/logger"
import { Readable } from "node:stream"

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

async function requireSession(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return null
  return session
}

const app = new Hono()

app.use(logger())
app.use(
  "/*",
  cors({
    origin: env.CORS_ORIGIN,
    allowMethods: ["GET", "POST", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
)

app.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw))

app.post("/api/upload", async (c) => {
  const session = await requireSession(c.req.raw)
  if (!session) return c.json({ error: "Unauthorized" }, 401)

  const formData = await c.req.raw.formData()
  const file = formData.get("file") as globalThis.File | null
  if (!file) return c.json({ error: "No file provided" }, 400)

  try {
    const safeName = file.name.replace(/[^\w.-]+/g, "_")
    const key = `uploads/${Date.now()}-${safeName}`
    const arrayBuffer = await file.arrayBuffer()
    await r2.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: new Uint8Array(arrayBuffer),
        ContentType: file.type || "application/octet-stream",
      }),
    )
    return c.json({ key })
  } catch (error) {
    console.error("[upload]", error)
    return c.json({ error: "Upload failed" }, 500)
  }
})

app.post("/api/statement-attachments/upload", async (c) => {
  const session = await requireSession(c.req.raw)
  if (!session) return c.json({ error: "Unauthorized" }, 401)

  const formData = await c.req.raw.formData()
  const rawEntryId = formData.get("entryId")
  const entryId = typeof rawEntryId === "string" && rawEntryId.length > 0 ? rawEntryId : null
  const file = formData.get("file") as globalThis.File | null

  if (!file) return c.json({ error: "No file provided" }, 400)
  if (file.size > MAX_ATTACHMENT_BYTES) return c.json({ error: `File exceeds ${MAX_ATTACHMENT_BYTES} bytes` }, 413)

  if (entryId) {
    const entry = await db.query.bankStatementEntry.findFirst({
      where: eq(bankStatementEntry.id, entryId),
      columns: { id: true },
    })
    if (!entry) return c.json({ error: "Entry not found" }, 404)
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

  const [row] = await db
    .insert(bankStatementAttachment)
    .values({
      id: attachmentId,
      bankStatementEntryId: entryId,
      r2Key: key,
      originalName: file.name,
      contentType: file.type || "application/octet-stream",
      size: file.size,
      uploadedById: session.user.id,
    })
    .returning()

  return c.json(row)
})

app.get("/api/statement-attachments/preview", async (c) => {
  const session = await requireSession(c.req.raw)
  if (!session) return c.json({ error: "Unauthorized" }, 401)

  const id = c.req.query("id")
  if (!id) return c.json({ error: "Missing id" }, 400)

  const row = await db.query.bankStatementAttachment.findFirst({
    where: eq(bankStatementAttachment.id, id),
  })
  if (!row) return c.json({ error: "Not found" }, 404)

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

app.get("/api/statement-attachments/export", async (c) => {
  const session = await requireSession(c.req.raw)
  if (!session) return c.json({ error: "Unauthorized" }, 401)

  const year = Number(c.req.query("year"))
  const month = Number(c.req.query("month"))
  const bankAccountId = c.req.query("bankAccountId") || undefined

  if (!Number.isInteger(year) || year < 2000 || year > 9999) return c.json({ error: "Invalid year" }, 400)
  if (!Number.isInteger(month) || month < 1 || month > 12) return c.json({ error: "Invalid month" }, 400)

  const start = `${year}-${pad2(month)}-01`
  const end = `${year}-${pad2(month)}-${pad2(lastDay(year, month))}`

  const conditions = [gte(bankStatementEntry.date, start), lte(bankStatementEntry.date, end)]
  if (bankAccountId) conditions.push(eq(bankStatementEntry.bankAccountId, bankAccountId))

  const rows = await db
    .select({
      attachment: bankStatementAttachment,
      entry: bankStatementEntry,
    })
    .from(bankStatementAttachment)
    .innerJoin(bankStatementEntry, eq(bankStatementAttachment.bankStatementEntryId, bankStatementEntry.id))
    .where(and(...conditions))

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

app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext: (_opts, context) => createContext({ context }),
  }),
)

app.get("/", (c) => c.text("OK"))

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`)
  },
)
