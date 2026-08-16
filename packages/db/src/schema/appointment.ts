import { createId } from "@paralleldrive/cuid2"
import { index, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core"

import { createdAt, timestampMs, updatedAt } from "./columns"
import { customer } from "./customer"
import { salon } from "./salon"

export const appointment = sqliteTable(
  "appointment",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    name: text("name").notNull(),
    startsAt: timestampMs("starts_at").notNull(),
    clientId: text("client_id")
      .notNull()
      .references(() => customer.id, { onDelete: "cascade" }),
    masterId: text("master_id")
      .notNull()
      .references(() => customer.id, { onDelete: "restrict" }),
    salonId: text("salon_id")
      .notNull()
      .references(() => salon.id, { onDelete: "restrict" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index("appointment_starts_at_idx").on(table.startsAt),
    index("appointment_client_id_idx").on(table.clientId),
    index("appointment_master_id_idx").on(table.masterId),
    index("appointment_salon_id_idx").on(table.salonId),
  ],
)

export const personnelOnAppointments = sqliteTable(
  "appointment_personnel",
  {
    appointmentId: text("appointment_id")
      .notNull()
      .references(() => appointment.id, { onDelete: "cascade" }),
    personnelId: text("personnel_id")
      .notNull()
      .references(() => customer.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (table) => [primaryKey({ columns: [table.personnelId, table.appointmentId] })],
)
