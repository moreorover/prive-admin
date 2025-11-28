import { relations } from "drizzle-orm";
import { pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const entityHistoryEnum = pgEnum("entity_type", [
  "contact",
  "booking",
  "hair_order",
  "hair_assigned",
]);

export const entityHistory = pgTable("entity_history", {
  id: uuid("id").primaryKey().defaultRandom(),

  // Polymorphic reference - stores which table and which record
  entityType: entityHistoryEnum("entity_type").notNull(),
  entityId: text("entity_id").notNull(),

  changedById: text("changed_by_id")
    .notNull()
    .references(() => user.id),

  fieldName: text("field_name").notNull(),
  oldValue: text("old_value"),
  newValue: text("new_value"),

  changedAt: timestamp("changed_at").defaultNow().notNull(),
});

export const entityHistoryRelations = relations(entityHistory, ({ one }) => ({
  changedBy: one(user, {
    fields: [entityHistory.changedById],
    references: [user.id],
  }),
}));
