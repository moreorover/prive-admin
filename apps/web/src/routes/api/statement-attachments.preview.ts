import { GetObjectCommand } from "@aws-sdk/client-s3"
import { auth } from "@prive-admin-tanstack/auth"
import { db } from "@prive-admin-tanstack/db"
import { bankStatementAttachment } from "@prive-admin-tanstack/db/schema/bank-statement-attachment"
import { createFileRoute } from "@tanstack/react-router"
import { eq } from "drizzle-orm"
import { Readable } from "node:stream"

import { bucketName, r2 } from "@/lib/r2"

export const Route = createFileRoute("/api/statement-attachments/preview")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const session = await auth.api.getSession({ headers: request.headers })
        if (!session) {
          return Response.json({ error: "Unauthorized" }, { status: 401 })
        }

        const url = new URL(request.url)
        const id = url.searchParams.get("id")
        if (!id) {
          return Response.json({ error: "Missing id" }, { status: 400 })
        }

        const row = await db.query.bankStatementAttachment.findFirst({
          where: eq(bankStatementAttachment.id, id),
        })
        if (!row) {
          return Response.json({ error: "Not found" }, { status: 404 })
        }

        let obj
        try {
          obj = await r2.send(new GetObjectCommand({ Bucket: bucketName, Key: row.r2Key }))
        } catch (error) {
          console.error("[statement-attachment preview] R2", error)
          return Response.json({ error: "Fetch failed" }, { status: 500 })
        }
        if (!obj.Body) {
          return Response.json({ error: "Empty body" }, { status: 500 })
        }

        const webStream = Readable.toWeb(obj.Body as Readable) as unknown as ReadableStream
        const filename = encodeURIComponent(row.originalName)
        return new Response(webStream, {
          headers: {
            "Content-Type": row.contentType || "application/octet-stream",
            "Content-Disposition": `inline; filename="${filename}"; filename*=UTF-8''${filename}`,
            "Cache-Control": "private, max-age=60",
          },
        })
      },
    },
  },
})
