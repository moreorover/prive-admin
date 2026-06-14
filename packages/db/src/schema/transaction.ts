import { createId } from "@paralleldrive/cuid2"
import { pgTable, integer, text, timestamp } from "drizzle-orm/pg-core"

import { appointment } from "./appointment"
import { customer } from "./customer"
import { order } from "./order"

export const transaction = pgTable("transaction", {
  id: text("id").primaryKey().$defaultFn(createId),
  name: text("name"),
  notes: text("notes"),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  customerId: text("customer_id").references(() => customer.id, { onDelete: "set null" }),
  orderId: text("order_id").references(() => order.id, { onDelete: "set null" }),
  appointmentId: text("appointment_id").references(() => appointment.id, { onDelete: "set null" }),
})
