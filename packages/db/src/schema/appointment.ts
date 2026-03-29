import { createId } from "@paralleldrive/cuid2"
import { pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core"

import { customer } from "./customer"

export const appointment = pgTable("appointments", {
  id: text("id").primaryKey().$defaultFn(createId),
  name: text("name").notNull(),
  startsAt: timestamp("starts_at").notNull(),
  clientId: text("client_id")
    .notNull()
    .references(() => customer.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => new Date())
    .notNull(),
})

export const personnelOnAppointments = pgTable(
  "appointment_personnel",
  {
    appointmentId: text("appointment_id")
      .notNull()
      .references(() => appointment.id, { onDelete: "cascade" }),
    personnelId: text("personnel_id")
      .notNull()
      .references(() => customer.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.personnelId, table.appointmentId] })],
)
