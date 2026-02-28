import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import {
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { user } from "./auth";
import { customer } from "./customer";

export const hairOrder = pgTable(
  "hair_order",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    uid: serial("uid").unique(),
    placedAt: timestamp("placed_at"),
    arrivedAt: timestamp("arrived_at"),
    status: text("status", { enum: ["pending", "completed"] })
      .default("pending")
      .notNull(),
    weightReceived: integer("weight_received").default(0).notNull(),
    weightUsed: integer("weight_used").default(0).notNull(),
    total: integer("total").default(0).notNull(),
    customerId: text("customer_id")
      .notNull()
      .references(() => customer.id),
    createdById: text("created_by_id")
      .notNull()
      .references(() => user.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("hair_order_customerId_idx").on(table.customerId),
    index("hair_order_createdById_idx").on(table.createdById),
  ],
);

export const hairOrderRelations = relations(hairOrder, ({ one }) => ({
  customer: one(customer, {
    fields: [hairOrder.customerId],
    references: [customer.id],
  }),
  createdBy: one(user, {
    fields: [hairOrder.createdById],
    references: [user.id],
    relationName: "hairOrderCreatedBy",
  }),
}));
