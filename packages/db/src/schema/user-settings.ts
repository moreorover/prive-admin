import { pgTable, text, timestamp } from "drizzle-orm/pg-core"

import { legalEntity } from "./legal-entity"
import { user } from "./auth"

export const userSettings = pgTable("user_settings", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  preferredCurrency: text("preferred_currency").notNull(),
  activeLegalEntityId: text("active_legal_entity_id").references(() => legalEntity.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
})
