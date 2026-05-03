import { createId } from "@paralleldrive/cuid2"
import { pgTable, text, timestamp } from "drizzle-orm/pg-core"

export const legalEntity = pgTable("legal_entity", {
  id: text("id").primaryKey().$defaultFn(createId),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'LTD' | 'IV' | 'MB'
  country: text("country").notNull(), // 'GB' | 'LT'
  defaultCurrency: text("default_currency").notNull(), // 'GBP' | 'EUR'
  registrationNumber: text("registration_number"),
  vatNumber: text("vat_number"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .$onUpdate(() => new Date())
    .notNull(),
})
