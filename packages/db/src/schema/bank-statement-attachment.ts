import { createId } from "@paralleldrive/cuid2"
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

import { user } from "./auth"
import { bankStatementEntry } from "./bank-statement-entry"
import { createdAt } from "./columns"

export const bankStatementAttachment = sqliteTable(
  "bank_statement_attachment",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    bankStatementEntryId: text("bank_statement_entry_id").references(() => bankStatementEntry.id, {
      onDelete: "cascade",
    }),
    r2Key: text("r2_key").notNull().unique(),
    originalName: text("original_name").notNull(),
    contentType: text("content_type").notNull(),
    size: integer("size").notNull(),
    uploadedById: text("uploaded_by_id").references(() => user.id, { onDelete: "set null" }),
    uploadedAt: createdAt("uploaded_at"),
  },
  (table) => [
    index("bank_statement_attachment_entry_id_idx").on(table.bankStatementEntryId),
    index("bank_statement_attachment_uploaded_at_idx").on(table.uploadedAt),
  ],
)
