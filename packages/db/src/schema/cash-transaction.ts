import { createId } from "@paralleldrive/cuid2"
import { date, index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core"

import { user } from "./auth"
import { customer } from "./customer"

export const cashTransaction = pgTable(
  "cash_transaction",
  {
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
  },
  (table) => [
    index("cash_transaction_created_at_id_idx").on(table.createdAt, table.id),
    index("cash_transaction_customer_id_idx").on(table.customerId),
    index("cash_transaction_currency_created_at_idx").on(table.currency, table.createdAt),
  ],
)
