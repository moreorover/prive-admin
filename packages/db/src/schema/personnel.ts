import { createId } from "@paralleldrive/cuid2"
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

import { createdAt, updatedAt } from "./columns"
import { customer } from "./customer"
import { salon } from "./salon"

export const personnel = sqliteTable("personnel", {
  id: text("id").primaryKey().$defaultFn(createId),
  customerId: text("customer_id")
    .notNull()
    .unique()
    .references(() => customer.id, { onDelete: "restrict" }),
  type: text("type", { enum: ["master", "assistant"] }).notNull(),
  active: integer("active", { mode: "boolean" }).default(true).notNull(),
  salonId: text("salon_id").references(() => salon.id, { onDelete: "restrict" }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})
