import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import { z } from "zod";
import { user } from "./auth";
import { booking } from "./booking";
import { entityHistory } from "./entityHistory";
import { hairAssigned, hairOrder } from "./hairOrder";

export const customer = pgTable("customer", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  phoneNumber: text("phoneNumber"),
  createdById: text("created_by_id")
    .notNull()
    .references(() => user.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const customerCreateSchema = createInsertSchema(customer).omit({
  createdById: true,
});
export const customerUpdateSchema = createUpdateSchema(customer).extend({
  id: z.uuid(),
});

export const customerRelations = relations(customer, ({ one, many }) => ({
  createdBy: one(user, {
    fields: [customer.createdById],
    references: [user.id],
  }),
  createdBookings: many(booking),
  createdHairOrders: many(hairOrder),
  createdHairAssigned: many(hairAssigned),
  history: many(entityHistory),
}));
