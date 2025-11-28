import { z } from "zod";

// We're keeping a simple non-relational schema here.
// IRL, you will have a schema for your data models.
export const contactSchema = z.object({
  id: z.string(),
  name: z.string(),
  phoneNumber: z.string().nullable(),
  createdAt: z.string(),
});

export type Contact = z.infer<typeof contactSchema>;
