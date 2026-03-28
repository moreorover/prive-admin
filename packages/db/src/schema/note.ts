import { createId } from "@paralleldrive/cuid2"
import { pgTable, text, timestamp } from "drizzle-orm/pg-core"

import { appointment } from "./appointment"
import { user } from "./auth"
import { customer } from "./customer"
import { hairOrder } from "./hair"

export const note = pgTable("notes", {
  id: text("id").primaryKey().$defaultFn(createId),
  note: text("note").notNull(),
  customerId: text("customer_id")
    .notNull()
    .references(() => customer.id, { onDelete: "cascade" }),
  appointmentId: text("appointment_id").references(() => appointment.id, { onDelete: "cascade" }),
  hairOrderId: text("hair_order_id").references(() => hairOrder.id, { onDelete: "cascade" }),
  createdById: text("created_by_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => new Date())
    .notNull(),
})
