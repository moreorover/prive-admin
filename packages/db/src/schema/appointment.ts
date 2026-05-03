import { createId } from "@paralleldrive/cuid2"
import { pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core"

import { customer } from "./customer"
import { legalEntity } from "./legal-entity"
import { salon } from "./salon"

export const appointment = pgTable("appointment", {
  id: text("id").primaryKey().$defaultFn(createId),
  name: text("name").notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  clientId: text("client_id")
    .notNull()
    .references(() => customer.id, { onDelete: "cascade" }),
  salonId: text("salon_id").references(() => salon.id, { onDelete: "restrict" }),
  legalEntityId: text("legal_entity_id").references(() => legalEntity.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
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
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.personnelId, table.appointmentId] })],
)
