import { DeleteObjectCommand } from "@aws-sdk/client-s3"
import { db } from "@prive-admin-tanstack/db"
import { bankStatementAttachment } from "@prive-admin-tanstack/db/schema/bank-statement-attachment"
import { bankStatementEntry } from "@prive-admin-tanstack/db/schema/bank-statement-entry"
import { TRPCError } from "@trpc/server"
import { and, desc, eq, isNotNull, isNull } from "drizzle-orm"
import { z } from "zod"

import { protectedProcedure, router } from "../index"
import { bucketName, r2 } from "../r2"

export const bankStatementAttachmentsRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        entryId: z.string().min(1).optional(),
        assigned: z.boolean().optional(),
      }),
    )
    .query(({ input }) => {
      const conditions = []
      if (input.entryId) conditions.push(eq(bankStatementAttachment.bankStatementEntryId, input.entryId))
      if (input.assigned === false) conditions.push(isNull(bankStatementAttachment.bankStatementEntryId))
      if (input.assigned === true) conditions.push(isNotNull(bankStatementAttachment.bankStatementEntryId))

      return db.query.bankStatementAttachment.findMany({
        where: conditions.length > 0 ? and(...conditions) : undefined,
        orderBy: [desc(bankStatementAttachment.uploadedAt)],
      })
    }),

  counts: protectedProcedure.query(async () => {
    const rows = await db
      .select({ entryId: bankStatementAttachment.bankStatementEntryId })
      .from(bankStatementAttachment)
    const counts = new Map<string, number>()
    for (const r of rows) {
      if (!r.entryId) continue
      counts.set(r.entryId, (counts.get(r.entryId) ?? 0) + 1)
    }
    return Object.fromEntries(counts)
  }),

  assign: protectedProcedure
    .input(z.object({ id: z.string().min(1), entryId: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const entry = await db.query.bankStatementEntry.findFirst({
        where: eq(bankStatementEntry.id, input.entryId),
        columns: { id: true },
      })
      if (!entry) throw new TRPCError({ code: "NOT_FOUND", message: "Entry not found" })
      const [row] = await db
        .update(bankStatementAttachment)
        .set({ bankStatementEntryId: input.entryId })
        .where(eq(bankStatementAttachment.id, input.id))
        .returning()
      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Attachment not found" })
      return row
    }),

  unassign: protectedProcedure.input(z.object({ id: z.string().min(1) })).mutation(async ({ input }) => {
    const [row] = await db
      .update(bankStatementAttachment)
      .set({ bankStatementEntryId: null })
      .where(eq(bankStatementAttachment.id, input.id))
      .returning()
    if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Attachment not found" })
    return row
  }),

  delete: protectedProcedure.input(z.object({ id: z.string().min(1) })).mutation(async ({ input }) => {
    const row = await db.query.bankStatementAttachment.findFirst({
      where: eq(bankStatementAttachment.id, input.id),
    })
    if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Attachment not found" })
    await r2.send(new DeleteObjectCommand({ Bucket: bucketName, Key: row.r2Key }))
    await db.delete(bankStatementAttachment).where(eq(bankStatementAttachment.id, input.id))
    return { id: input.id }
  }),
})
