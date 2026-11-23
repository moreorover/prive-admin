import { createId } from "@paralleldrive/cuid2"
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

import { appointment } from "./appointment"
import { createdAt } from "./columns"
import { customer } from "./customer"
import { order } from "./order"

export const transaction = sqliteTable(
  "transaction",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    name: text("name"),
    notes: text("notes"),
    amount: integer("amount").notNull(),
    currency: text("currency").notNull(),
    createdAt: createdAt(),
    customerId: text("customer_id").references(() => customer.id, { onDelete: "set null" }),
    orderId: text("order_id").references(() => order.id, { onDelete: "set null" }),
    appointmentId: text("appointment_id").references(() => appointment.id, { onDelete: "set null" }),
  },
  (table) => [
    index("transaction_appointment_id_idx").on(table.appointmentId),
    index("transaction_customer_id_idx").on(table.customerId),
    index("transaction_order_id_idx").on(table.orderId),
  ],
)
