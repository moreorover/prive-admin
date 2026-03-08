import { createId } from "@paralleldrive/cuid2"
import { relations } from "drizzle-orm"
import { index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core"

import { appointment } from "./appointment"
import { user } from "./auth"
import { customer } from "./customer"
import { hairOrder } from "./hair-order"

export const transaction = pgTable(
  "transaction",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    amount: integer("amount").notNull(),
    type: text("type").notNull(),
    description: text("description"),
    date: timestamp("date").notNull(),
    customerId: text("customer_id")
      .notNull()
      .references(() => customer.id),
    appointmentId: text("appointment_id").references(() => appointment.id),
    hairOrderId: text("hair_order_id").references(() => hairOrder.id),
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
    index("transaction_customerId_idx").on(table.customerId),
    index("transaction_appointmentId_idx").on(table.appointmentId),
    index("transaction_hairOrderId_idx").on(table.hairOrderId),
  ],
)

export const transactionRelations = relations(transaction, ({ one }) => ({
  customer: one(customer, {
    fields: [transaction.customerId],
    references: [customer.id],
  }),
  appointment: one(appointment, {
    fields: [transaction.appointmentId],
    references: [appointment.id],
  }),
  hairOrder: one(hairOrder, {
    fields: [transaction.hairOrderId],
    references: [hairOrder.id],
  }),
  createdBy: one(user, {
    fields: [transaction.createdById],
    references: [user.id],
    relationName: "transactionCreatedBy",
  }),
}))
