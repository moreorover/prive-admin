import { relations } from "drizzle-orm";
import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import { z } from "zod";
import { user } from "./auth";
import { booking } from "./booking";
import { contact } from "./contact";
import { entityHistory } from "./entityHistory";

export const hairOrder = pgTable("hair_orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  placedAt: timestamp("placed_at", { mode: "date" }),
  arrivedAt: timestamp("arrived_at", { mode: "date" }),
  weightReceived: integer("weight_received").default(0).notNull(),
  weightUsed: integer("weight_used").default(0).notNull(),
  pricePerGram: integer("price_per_gram").default(0).notNull(),
  total: integer("total").default(0).notNull(),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => contact.id, { onDelete: "cascade" }),
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
  id: uuid("id").primaryKey().defaultRandom(),
  bookingId: uuid("booking_id").references(() => booking.id, {
    onDelete: "cascade",
  }),
  hairOrderId: uuid("hair_order_id")
    .notNull()
    .references(() => hairOrder.id, { onDelete: "cascade" }),
  weightInGrams: integer("weight_in_grams").default(0).notNull(),
  soldFor: integer("sold_for").default(0).notNull(),
  profit: integer("profit").default(0).notNull(),
  pricePerGram: integer("price_per_gram").default(0).notNull(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => contact.id, { onDelete: "cascade" }),
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
  customer: one(contact, {
    fields: [hairOrder.customerId],
    references: [contact.id],
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
    client: one(contact, {
      fields: [hairAssigned.clientId],
      references: [contact.id],
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
