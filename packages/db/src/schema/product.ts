import { createId } from "@paralleldrive/cuid2"
import { pgTable, integer, text, timestamp, unique } from "drizzle-orm/pg-core"

export const product = pgTable("products", {
  id: text("id").primaryKey().$defaultFn(createId),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .$onUpdate(() => new Date())
    .notNull(),
})

export const productVariant = pgTable(
  "product_variants",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    productId: text("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    size: text("size").notNull(),
    price: integer("price").notNull(),
    stock: integer("stock").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [unique().on(table.productId, table.size)],
)
