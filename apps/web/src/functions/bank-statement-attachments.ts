import { DeleteObjectCommand } from "@aws-sdk/client-s3"
import { db } from "@prive-admin-tanstack/db"
import { bankStatementAttachment } from "@prive-admin-tanstack/db/schema/bank-statement-attachment"
import { createServerFn } from "@tanstack/react-start"
import { desc, eq } from "drizzle-orm"
import { z } from "zod"

import { bucketName, r2 } from "@/lib/r2"
import { requireAuthMiddleware } from "@/middleware/auth"

export const listAttachments = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .inputValidator(z.object({ entryId: z.string().min(1) }))
  .handler(async ({ data }) => {
    return db.query.bankStatementAttachment.findMany({
      where: eq(bankStatementAttachment.bankStatementEntryId, data.entryId),
      orderBy: [desc(bankStatementAttachment.uploadedAt)],
    })
  })

export const listAttachmentCounts = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .handler(async () => {
    const rows = await db
      .select({ entryId: bankStatementAttachment.bankStatementEntryId })
      .from(bankStatementAttachment)
    const counts = new Map<string, number>()
    for (const r of rows) counts.set(r.entryId, (counts.get(r.entryId) ?? 0) + 1)
    return Object.fromEntries(counts)
  })

export const deleteAttachment = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    const row = await db.query.bankStatementAttachment.findFirst({
      where: eq(bankStatementAttachment.id, data.id),
    })
    if (!row) throw new Error("Attachment not found")
    await r2.send(new DeleteObjectCommand({ Bucket: bucketName, Key: row.r2Key }))
    await db.delete(bankStatementAttachment).where(eq(bankStatementAttachment.id, data.id))
    return { id: data.id }
  })
