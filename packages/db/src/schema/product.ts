import { createId } from "@paralleldrive/cuid2"
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core"

import { createdAt, updatedAt } from "./columns"

export const product = sqliteTable("product", {
  id: text("id").primaryKey().$defaultFn(createId),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const productVariant = sqliteTable(
  "product_variant",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    productId: text("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    size: text("size").notNull(),
    price: integer("price").notNull(),
    stock: integer("stock").default(0).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("product_variant_product_id_size_unique").on(table.productId, table.size),
    index("product_variant_product_id_idx").on(table.productId),
  ],
)
