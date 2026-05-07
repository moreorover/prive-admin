import { createId } from "@paralleldrive/cuid2"
import { pgTable, text, timestamp, unique } from "drizzle-orm/pg-core"

import { legalEntity } from "./legal-entity"

export const bankAccount = pgTable(
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
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [unique("bank_account_iban_unique").on(table.iban)],
)
