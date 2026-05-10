import { createId } from "@paralleldrive/cuid2"
import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core"

import { user } from "./auth"
import { bankStatementEntry } from "./bank-statement-entry"

export const bankStatementAttachment = pgTable("bank_statement_attachment", {
  id: text("id").primaryKey().$defaultFn(createId),
  bankStatementEntryId: text("bank_statement_entry_id").references(() => bankStatementEntry.id, {
    onDelete: "cascade",
  }),
  r2Key: text("r2_key").notNull().unique(),
  originalName: text("original_name").notNull(),
  contentType: text("content_type").notNull(),
  size: integer("size").notNull(),
  uploadedById: text("uploaded_by_id").references(() => user.id, { onDelete: "set null" }),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).defaultNow().notNull(),
})
