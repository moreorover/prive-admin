import { createId } from "@paralleldrive/cuid2"
import { sqliteTable, text } from "drizzle-orm/sqlite-core"

import { createdAt, updatedAt } from "./columns"

export const legalEntity = sqliteTable("legal_entity", {
  id: text("id").primaryKey().$defaultFn(createId),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'LTD' | 'IV' | 'MB'
  country: text("country").notNull(), // 'GB' | 'LT'
  defaultCurrency: text("default_currency").notNull(), // 'GBP' | 'EUR'
  registrationNumber: text("registration_number"),
  vatNumber: text("vat_number"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})
