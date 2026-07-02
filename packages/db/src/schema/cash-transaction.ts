import { createId } from "@paralleldrive/cuid2"
import { date, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core"

import { user } from "./auth"
import { customer } from "./customer"

export const cashTransaction = pgTable("cash_transaction", {
  id: text("id").primaryKey().$defaultFn(createId),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull().default("EUR"),
  createdAt: date("created_at").notNull(),
  description: text("description"),
  notes: text("notes"),
  customerId: text("customer_id")
    .notNull()
    .references(() => customer.id, { onDelete: "restrict" }),
  createdById: text("created_by_id")
    .notNull()
    .references(() => user.id, { onDelete: "restrict" }),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .$onUpdate(() => new Date())
    .notNull(),
})
