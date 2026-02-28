import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import { index, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "./auth";

export const entityTypeEnum = pgEnum("entity_type", [
  "customer",
  "hair_order",
]);

export const entityHistory = pgTable(
  "entity_history",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    entityType: entityTypeEnum("entity_type").notNull(),
    entityId: text("entity_id").notNull(),
    changedById: text("changed_by_id")
      .notNull()
      .references(() => user.id),
    fieldName: text("field_name").notNull(),
    oldValue: text("old_value"),
    newValue: text("new_value"),
    changedAt: timestamp("changed_at").defaultNow().notNull(),
  },
  (table) => [
    index("entity_history_entity_idx").on(table.entityType, table.entityId),
    index("entity_history_changedById_idx").on(table.changedById),
  ],
);

export const entityHistoryRelations = relations(entityHistory, ({ one }) => ({
  changedBy: one(user, {
    fields: [entityHistory.changedById],
    references: [user.id],
  }),
}));
