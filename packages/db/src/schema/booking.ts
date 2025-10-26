import { relations } from "drizzle-orm";
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";
import { z } from "zod";
import { user } from "./auth";
import { customer } from "./customer";
import { entityHistory } from "./entityHistory";
import { hairAssigned } from "./hairOrder";

export const booking = pgTable("booking", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  startsAt: timestamp("starts_at").notNull(),
  clientId: text("client_id")
    .notNull()
    .references(() => customer.id, { onDelete: "cascade" }),
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
  client: one(customer, {
    fields: [booking.clientId],
    references: [customer.id],
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
