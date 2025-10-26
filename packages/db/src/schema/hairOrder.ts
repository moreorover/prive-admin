import { relations } from "drizzle-orm";
import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import { z } from "zod";
import { user } from "./auth";
import { booking } from "./booking";
import { customer } from "./customer";
import { entityHistory } from "./entityHistory";

export const hairOrder = pgTable("hair_orders", {
  id: text("id").primaryKey(),
  uid: integer("uid").notNull().unique(),
  placedAt: timestamp("placed_at", { mode: "date" }),
  arrivedAt: timestamp("arrived_at", { mode: "date" }),
  weightReceived: integer("weight_received").default(0).notNull(),
  weightUsed: integer("weight_used").default(0).notNull(),
  pricePerGram: integer("price_per_gram").default(0).notNull(),
  total: integer("total").default(0).notNull(),

  customerId: text("customer_id")
    .notNull()
    .references(() => customer.id, { onDelete: "cascade" }),

  createdById: text("created_by_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const hairAssigned = pgTable("hair_assigned", {
  id: text("id").primaryKey(),
  bookingId: text("booking_id").references(() => booking.id, {
    onDelete: "cascade",
  }),
  hairOrderId: text("hair_order_id")
    .notNull()
    .references(() => hairOrder.id, { onDelete: "cascade" }),
  weightInGrams: integer("weight_in_grams").default(0).notNull(),
  soldFor: integer("sold_for").default(0).notNull(),
  profit: integer("profit").default(0).notNull(),
  pricePerGram: integer("price_per_gram").default(0).notNull(),
  clientId: text("client_id")
    .notNull()
    .references(() => customer.id, { onDelete: "cascade" }),
  createdById: text("created_by_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// Relations
export const hairOrderRelations = relations(hairOrder, ({ one, many }) => ({
  customer: one(customer, {
    fields: [hairOrder.customerId],
    references: [customer.id],
  }),
  createdBy: one(user, {
    fields: [hairOrder.createdById],
    references: [user.id],
  }),
  hairAssigned: many(hairAssigned),
  history: many(entityHistory),
}));

export const hairAssignedRelations = relations(
  hairAssigned,
  ({ one, many }) => ({
    booking: one(booking, {
      fields: [hairAssigned.bookingId],
      references: [booking.id],
    }),
    hairOrder: one(hairOrder, {
      fields: [hairAssigned.hairOrderId],
      references: [hairOrder.id],
    }),
    client: one(customer, {
      fields: [hairAssigned.clientId],
      references: [customer.id],
    }),
    createdBy: one(user, {
      fields: [hairAssigned.createdById],
      references: [user.id],
    }),
    history: many(entityHistory),
  }),
);

// Zod schemas
export const hairOrderCreateSchema = createInsertSchema(hairOrder);
export const hairOrderUpdateSchema = createUpdateSchema(hairOrder).extend({
  id: z.uuid(),
});

export const hairAssignedCreateSchema = createInsertSchema(hairAssigned);
export const hairAssignedUpdateSchema = createUpdateSchema(hairAssigned).extend(
  {
    id: z.uuid(),
  },
);
