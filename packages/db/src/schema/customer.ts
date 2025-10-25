import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import { user } from "./auth";

export const customer = pgTable("customer", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  phoneNumber: text("phoneNumber"),
  createdById: text("created_by_id")
    .notNull()
    .references(() => user.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const customerHistory = pgTable("customer_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customer.id, { onDelete: "cascade" }),
  changedById: text("changed_by_id")
    .notNull()
    .references(() => user.id),
  fieldName: text("field_name").notNull(), // "name", "phoneNumber", etc.
  oldValue: text("old_value"), // Store as text, cast when needed
  newValue: text("new_value"), // Store as text, cast when needed
  changedAt: timestamp("changed_at").defaultNow().notNull(),
});

export const customerCreateSchema = createInsertSchema(customer).omit({
  createdById: true,
});
export const customerUpdateSchema = createUpdateSchema(customer);

export const customerRelations = relations(customer, ({ one, many }) => ({
  createdBy: one(user, {
    fields: [customer.createdById],
    references: [user.id],
  }),
  history: many(customerHistory),
}));

export const customerHistoryRelations = relations(
  customerHistory,
  ({ one }) => ({
    customer: one(customer, {
      fields: [customerHistory.customerId],
      references: [customer.id],
    }),
    changedBy: one(user, {
      fields: [customerHistory.changedById],
      references: [user.id],
    }),
  }),
);
