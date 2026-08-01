import { sqliteTable, text } from "drizzle-orm/sqlite-core"

import { user } from "./auth"
import { createdAt, updatedAt } from "./columns"

export const userSettings = sqliteTable("user_settings", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  preferredCurrency: text("preferred_currency").notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})
