import { createId } from "@paralleldrive/cuid2"
import { sqliteTable, text } from "drizzle-orm/sqlite-core"

import { createdAt, updatedAt } from "./columns"

export const salon = sqliteTable("salon", {
  id: text("id").primaryKey().$defaultFn(createId),
  name: text("name").notNull(),
  address: text("address"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})
