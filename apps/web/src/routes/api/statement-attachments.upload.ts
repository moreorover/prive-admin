import { PutObjectCommand } from "@aws-sdk/client-s3"
import { auth } from "@prive-admin-tanstack/auth"
import { db } from "@prive-admin-tanstack/db"
import { bankStatementAttachment } from "@prive-admin-tanstack/db/schema/bank-statement-attachment"
import { bankStatementEntry } from "@prive-admin-tanstack/db/schema/bank-statement-entry"
import { createFileRoute } from "@tanstack/react-router"
import { eq } from "drizzle-orm"

import { bucketName, r2 } from "@/lib/r2"

const MAX_BYTES = 25 * 1024 * 1024

export const Route = createFileRoute("/api/statement-attachments/upload")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const session = await auth.api.getSession({ headers: request.headers })
        if (!session) {
          return Response.json({ error: "Unauthorized" }, { status: 401 })
        }

        const formData = await request.formData()
        const entryId = formData.get("entryId")
        const file = formData.get("file") as globalThis.File | null

        if (typeof entryId !== "string" || !entryId) {
          return Response.json({ error: "Missing entryId" }, { status: 400 })
        }
        if (!file) {
          return Response.json({ error: "No file provided" }, { status: 400 })
        }
        if (file.size > MAX_BYTES) {
          return Response.json({ error: `File exceeds ${MAX_BYTES} bytes` }, { status: 413 })
        }

        const entry = await db.query.bankStatementEntry.findFirst({
          where: eq(bankStatementEntry.id, entryId),
          columns: { id: true },
        })
        if (!entry) {
          return Response.json({ error: "Entry not found" }, { status: 404 })
        }

        const safeName = file.name.replace(/[^\w.-]+/g, "_")
        const key = `statement_uploads/${entryId}/${Date.now()}-${safeName}`
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
          return Response.json({ error: "Upload failed" }, { status: 500 })
        }

        const [row] = await db
          .insert(bankStatementAttachment)
          .values({
            bankStatementEntryId: entryId,
            r2Key: key,
            originalName: file.name,
            contentType: file.type || "application/octet-stream",
            size: file.size,
            uploadedById: session.user.id,
          })
          .returning()

        return Response.json(row)
      },
    },
  },
})
