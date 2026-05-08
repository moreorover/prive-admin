import { GetObjectCommand } from "@aws-sdk/client-s3"
import { auth } from "@prive-admin-tanstack/auth"
import { db } from "@prive-admin-tanstack/db"
import { bankStatementAttachment } from "@prive-admin-tanstack/db/schema/bank-statement-attachment"
import { bankStatementEntry } from "@prive-admin-tanstack/db/schema/bank-statement-entry"
import { createFileRoute } from "@tanstack/react-router"
// archiver@8 is ESM-only and exports ZipArchive class; @types/archiver still describes v6/v7 callable.
import * as archiverPkg from "archiver"
import { and, eq, gte, lte } from "drizzle-orm"
import { Readable } from "node:stream"

import { bucketName, r2 } from "@/lib/r2"

const ZipArchive = (
  archiverPkg as unknown as {
    ZipArchive: new (opts?: unknown) => Readable & {
      append: (src: Readable | Buffer, opts: { name: string }) => void
      finalize: () => void
      on: (ev: string, cb: (err: Error) => void) => void
    }
  }
).ZipArchive

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

export const Route = createFileRoute("/api/statement-attachments/export")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const session = await auth.api.getSession({ headers: request.headers })
        if (!session) {
          return Response.json({ error: "Unauthorized" }, { status: 401 })
        }

        const url = new URL(request.url)
        const year = Number(url.searchParams.get("year"))
        const month = Number(url.searchParams.get("month"))
        const bankAccountId = url.searchParams.get("bankAccountId") || undefined

        if (!Number.isInteger(year) || year < 2000 || year > 9999) {
          return Response.json({ error: "Invalid year" }, { status: 400 })
        }
        if (!Number.isInteger(month) || month < 1 || month > 12) {
          return Response.json({ error: "Invalid month" }, { status: 400 })
        }

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
      },
    },
  },
})
