import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import { z } from "zod";
import { user } from "./auth";
import { booking } from "./booking";
import { entityHistory } from "./entityHistory";
import { hairAssigned, hairOrder } from "./hairOrder";

export const contact = pgTable("contact", {
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

export const contactCreateSchema = createInsertSchema(contact).omit({
  createdById: true,
});
export const contactUpdateSchema = createUpdateSchema(contact).extend({
  id: z.uuid(),
});

export const contactRelations = relations(contact, ({ one, many }) => ({
  createdBy: one(user, {
    fields: [contact.createdById],
    references: [user.id],
  }),
  bookings: many(booking),
  createdHairOrders: many(hairOrder),
  createdHairAssigned: many(hairAssigned),
  history: many(entityHistory),
}));
