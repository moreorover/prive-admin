import { createId } from "@paralleldrive/cuid2"
import { pgTable, text, timestamp } from "drizzle-orm/pg-core"

import { legalEntity } from "./legal-entity"

export const salon = pgTable("salon", {
  id: text("id").primaryKey().$defaultFn(createId),
  name: text("name").notNull(),
  country: text("country").notNull(), // 'GB' | 'LT'
  defaultLegalEntityId: text("default_legal_entity_id")
    .notNull()
    .references(() => legalEntity.id, { onDelete: "restrict" }),
  address: text("address"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .$onUpdate(() => new Date())
    .notNull(),
})
