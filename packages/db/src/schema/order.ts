import { createId } from "@paralleldrive/cuid2"
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core"

import { createdAt, updatedAt } from "./columns"
import { customer } from "./customer"
import { productVariant } from "./product"

export const order = sqliteTable(
  "order",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    customerId: text("customer_id")
      .notNull()
      .references(() => customer.id, { onDelete: "cascade" }),
    type: text("type").notNull().default("PURCHASE"),
    status: text("status").notNull().default("PENDING"),
    placedAt: text("placed_at").notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [index("order_customer_id_idx").on(table.customerId)],
)

export const orderItem = sqliteTable(
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
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("order_item_order_id_product_variant_id_unique").on(table.orderId, table.productVariantId),
    index("order_item_order_id_idx").on(table.orderId),
    index("order_item_product_variant_id_idx").on(table.productVariantId),
  ],
)
