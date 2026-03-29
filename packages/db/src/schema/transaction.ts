import { createId } from "@paralleldrive/cuid2"
import { pgTable, integer, text, timestamp, date } from "drizzle-orm/pg-core"

import { appointment } from "./appointment"
import { customer } from "./customer"
import { order } from "./order"

export const transaction = pgTable("transactions", {
  id: text("id").primaryKey().$defaultFn(createId),
  name: text("name"),
  notes: text("notes"),
  amount: integer("amount").notNull(),
  type: text("type").notNull().default("BANK"),
  status: text("status").notNull().default("PENDING"),
  completedDateBy: date("completed_date_by").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  customerId: text("customer_id")
    .notNull()
    .references(() => customer.id, { onDelete: "cascade" }),
  orderId: text("order_id").references(() => order.id, { onDelete: "set null" }),
  appointmentId: text("appointment_id").references(() => appointment.id, { onDelete: "set null" }),
})
