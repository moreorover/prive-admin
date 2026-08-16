import { createId } from "@paralleldrive/cuid2"
import { index, sqliteTable, text } from "drizzle-orm/sqlite-core"

import { appointment } from "./appointment"
import { user } from "./auth"
import { createdAt, updatedAt } from "./columns"
import { customer } from "./customer"
import { hairOrder } from "./hair"

export const note = sqliteTable(
  "note",
  {
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
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index("note_customer_id_idx").on(table.customerId),
    index("note_appointment_id_idx").on(table.appointmentId),
    index("note_hair_order_id_idx").on(table.hairOrderId),
  ],
)
