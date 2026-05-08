import { createId } from "@paralleldrive/cuid2"
import { pgTable, text, timestamp } from "drizzle-orm/pg-core"

import { legalEntity } from "./legal-entity"

export const bill = pgTable("bill", {
  id: text("id").primaryKey().$defaultFn(createId),
  legalEntityId: text("legal_entity_id")
    .notNull()
    .references(() => legalEntity.id, { onDelete: "restrict" }),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .$onUpdate(() => new Date())
    .notNull(),
})
