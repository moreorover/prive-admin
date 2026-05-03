import { createId } from "@paralleldrive/cuid2"
import { pgTable, integer, text, timestamp, date } from "drizzle-orm/pg-core"

import { appointment } from "./appointment"
import { customer } from "./customer"
import { legalEntity } from "./legal-entity"
import { order } from "./order"

export const transaction = pgTable("transaction", {
  id: text("id").primaryKey().$defaultFn(createId),
  name: text("name"),
  notes: text("notes"),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull(),
  type: text("type").notNull().default("BANK"),
  status: text("status").notNull().default("PENDING"),
  completedDateBy: date("completed_date_by").defaultNow().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  customerId: text("customer_id")
    .notNull()
    .references(() => customer.id, { onDelete: "cascade" }),
  orderId: text("order_id").references(() => order.id, { onDelete: "set null" }),
  appointmentId: text("appointment_id").references(() => appointment.id, { onDelete: "set null" }),
  legalEntityId: text("legal_entity_id").references(() => legalEntity.id, { onDelete: "restrict" }),
})
