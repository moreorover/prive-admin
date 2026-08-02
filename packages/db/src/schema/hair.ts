import { createId } from "@paralleldrive/cuid2"
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core"

import { appointment } from "./appointment"
import { user } from "./auth"
import { createdAt, updatedAt } from "./columns"
import { customer } from "./customer"

export const hairOrder = sqliteTable("hair_order", {
  id: text("id").primaryKey().$defaultFn(createId),
  uid: integer("uid").notNull().unique(),
  placedAt: text("placed_at"),
  arrivedAt: text("arrived_at"),
  status: text("status").notNull().default("PENDING"),
  weightReceived: integer("weight_received").default(0).notNull(),
  weightUsed: integer("weight_used").default(0).notNull(),
  pricePerGram: integer("price_per_gram").default(0).notNull(),
  total: integer("total").default(0).notNull(),
  customerId: text("customer_id")
    .notNull()
    .references(() => customer.id, { onDelete: "cascade" }),
  createdById: text("created_by_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const hairAssigned = sqliteTable(
  "hair_assigned",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    appointmentId: text("appointment_id").references(() => appointment.id, { onDelete: "cascade" }),
    hairOrderId: text("hair_order_id")
      .notNull()
      .references(() => hairOrder.id, { onDelete: "cascade" }),
    weightInGrams: integer("weight_in_grams").default(0).notNull(),
    soldFor: integer("sold_for").default(0).notNull(),
    profit: integer("profit").default(0).notNull(),
    pricePerGram: integer("price_per_gram").default(0).notNull(),
    soldAt: createdAt("sold_at"),
    clientId: text("client_id")
      .notNull()
      .references(() => customer.id, { onDelete: "cascade" }),
    createdById: text("created_by_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    index("hair_assigned_sold_at_idx").on(table.soldAt),
    index("hair_assigned_client_id_idx").on(table.clientId),
    index("hair_assigned_appointment_id_idx").on(table.appointmentId),
    index("hair_assigned_hair_order_id_idx").on(table.hairOrderId),
  ],
)
