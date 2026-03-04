import { createId } from "@paralleldrive/cuid2"
import { relations } from "drizzle-orm"
import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core"

import { user } from "./auth"
import { customer } from "./customer"

export const appointment = pgTable(
  "appointment",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    name: text("name").notNull(),
    startsAt: timestamp("starts_at").notNull(),
    endsAt: timestamp("ends_at"),
    status: text("status", { enum: ["scheduled", "completed", "cancelled", "no_show"] })
      .default("scheduled")
      .notNull(),
    notes: text("notes"),
    customerId: text("customer_id")
      .notNull()
      .references(() => customer.id),
    createdById: text("created_by_id")
      .notNull()
      .references(() => user.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("appointment_customerId_idx").on(table.customerId),
    index("appointment_createdById_idx").on(table.createdById),
    index("appointment_startsAt_idx").on(table.startsAt),
  ],
)

export const appointmentRelations = relations(appointment, ({ one }) => ({
  customer: one(customer, {
    fields: [appointment.customerId],
    references: [customer.id],
  }),
  createdBy: one(user, {
    fields: [appointment.createdById],
    references: [user.id],
    relationName: "appointmentCreatedBy",
  }),
}))
