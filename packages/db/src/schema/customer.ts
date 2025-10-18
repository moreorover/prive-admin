import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema, createUpdateSchema } from "drizzle-zod";

export const customer = pgTable("customer", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  phoneNumber: text("phoneNumber"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const customerCreateSchema = createInsertSchema(customer);
export const customerUpdateSchema = createUpdateSchema(customer);
