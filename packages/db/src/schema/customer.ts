import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import { index, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "./auth";

export const customer = pgTable("customer", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text("name").notNull(),
  email: text("email").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const customerUser = pgTable(
  "customer_user",
  {
    customerId: text("customer_id")
      .notNull()
      .references(() => customer.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.customerId, table.userId] }),
    index("customer_user_customerId_idx").on(table.customerId),
    index("customer_user_userId_idx").on(table.userId),
  ],
);

export const customerRelations = relations(customer, ({ many }) => ({
  customerUsers: many(customerUser),
}));

export const customerUserRelations = relations(customerUser, ({ one }) => ({
  customer: one(customer, {
    fields: [customerUser.customerId],
    references: [customer.id],
  }),
  user: one(user, {
    fields: [customerUser.userId],
    references: [user.id],
  }),
}));
