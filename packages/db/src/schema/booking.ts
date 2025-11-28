import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import { z } from "zod";
import { user } from "./auth";
import { contact } from "./contact";
import { entityHistory } from "./entityHistory";
import { hairAssigned } from "./hairOrder";

export const booking = pgTable("booking", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  startsAt: timestamp("starts_at").notNull(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => contact.id, { onDelete: "cascade" }),
  createdById: text("created_by_id")
    .notNull()
    .references(() => user.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

// Relations
export const bookingRelations = relations(booking, ({ one, many }) => ({
  client: one(contact, {
    fields: [booking.clientId],
    references: [contact.id],
  }),
  createdBy: one(user, {
    fields: [booking.createdById],
    references: [user.id],
  }),
  hairAssigned: many(hairAssigned),
  history: many(entityHistory),
}));

// Zod schemas
export const bookingCreateSchema = createInsertSchema(booking);
export const bookingUpdateSchema = createUpdateSchema(booking).extend({
  id: z.string(),
});
