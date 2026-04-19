import { createId } from "@paralleldrive/cuid2"
import { pgTable, integer, text, timestamp, date, unique } from "drizzle-orm/pg-core"

import { customer } from "./customer"
import { productVariant } from "./product"

export const order = pgTable("order", {
  id: text("id").primaryKey().$defaultFn(createId),
  customerId: text("customer_id")
    .notNull()
    .references(() => customer.id, { onDelete: "cascade" }),
  type: text("type").notNull().default("PURCHASE"),
  status: text("status").notNull().default("PENDING"),
  placedAt: date("placed_at").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .$onUpdate(() => new Date())
    .notNull(),
})

export const orderItem = pgTable(
  "order_item",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    orderId: text("order_id")
      .notNull()
      .references(() => order.id, { onDelete: "cascade" }),
    productVariantId: text("product_variant_id")
      .notNull()
      .references(() => productVariant.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull(),
    unitPrice: integer("unit_price").notNull(),
    totalPrice: integer("total_price").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [unique().on(table.orderId, table.productVariantId)],
)
