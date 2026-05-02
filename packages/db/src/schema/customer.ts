import { createId } from "@paralleldrive/cuid2"
import { pgTable, text, timestamp } from "drizzle-orm/pg-core"

export const customer = pgTable("customer", {
  id: text("id").primaryKey().$defaultFn(createId),
  name: text("name").notNull().unique(),
  phoneNumber: text("phone_number"),
  preferredCurrency: text("preferred_currency").notNull().default("GBP"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(() => new Date()),
})
