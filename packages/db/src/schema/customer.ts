import { createId } from "@paralleldrive/cuid2"
import { sqliteTable, text } from "drizzle-orm/sqlite-core"

import { createdAt, updatedAt } from "./columns"

export const customer = sqliteTable("customer", {
  id: text("id").primaryKey().$defaultFn(createId),
  name: text("name").notNull().unique(),
  phoneNumber: text("phone_number"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})
