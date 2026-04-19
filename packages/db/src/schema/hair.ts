import { createId } from "@paralleldrive/cuid2"
import { pgTable, integer, serial, text, timestamp, date } from "drizzle-orm/pg-core"

import { appointment } from "./appointment"
import { user } from "./auth"
import { customer } from "./customer"

export const hairOrder = pgTable("hair_order", {
  id: text("id").primaryKey().$defaultFn(createId),
  uid: serial("uid").notNull().unique(),
  placedAt: date("placed_at"),
  arrivedAt: date("arrived_at"),
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
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .$onUpdate(() => new Date())
    .notNull(),
})

export const hairAssigned = pgTable("hair_assigned", {
  id: text("id").primaryKey().$defaultFn(createId),
  appointmentId: text("appointment_id").references(() => appointment.id, { onDelete: "cascade" }),
  hairOrderId: text("hair_order_id")
    .notNull()
    .references(() => hairOrder.id, { onDelete: "cascade" }),
  weightInGrams: integer("weight_in_grams").default(0).notNull(),
  soldFor: integer("sold_for").default(0).notNull(),
  profit: integer("profit").default(0).notNull(),
  pricePerGram: integer("price_per_gram").default(0).notNull(),
  clientId: text("client_id")
    .notNull()
    .references(() => customer.id, { onDelete: "cascade" }),
  createdById: text("created_by_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .$onUpdate(() => new Date())
    .notNull(),
})
