import { createId } from "@paralleldrive/cuid2"
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

import { user } from "./auth"
import { timestampMs, updatedAt } from "./columns"
import { customer } from "./customer"

export const cashTransaction = sqliteTable(
  "cash_transaction",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    amount: integer("amount").notNull(),
    currency: text("currency").notNull().default("EUR"),
    createdAt: timestampMs("created_at").notNull(),
    description: text("description"),
    notes: text("notes"),
    customerId: text("customer_id")
      .notNull()
      .references(() => customer.id, { onDelete: "restrict" }),
    createdById: text("created_by_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    updatedAt: updatedAt(),
  },
  (table) => [
    index("cash_transaction_created_at_id_idx").on(table.createdAt, table.id),
    index("cash_transaction_customer_id_idx").on(table.customerId),
    index("cash_transaction_currency_created_at_idx").on(table.currency, table.createdAt),
  ],
)
