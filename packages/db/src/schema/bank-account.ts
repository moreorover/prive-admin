import { createId } from "@paralleldrive/cuid2"
import { index, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core"

import { createdAt, updatedAt } from "./columns"
import { legalEntity } from "./legal-entity"

export const bankAccount = sqliteTable(
  "bank_account",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    legalEntityId: text("legal_entity_id")
      .notNull()
      .references(() => legalEntity.id, { onDelete: "restrict" }),
    iban: text("iban").notNull(),
    currency: text("currency").notNull(), // 'EUR' | 'GBP'
    bankName: text("bank_name"),
    swift: text("swift"),
    displayName: text("display_name").notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("bank_account_iban_unique").on(table.iban),
    index("bank_account_legal_entity_id_idx").on(table.legalEntityId),
  ],
)
