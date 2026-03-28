import { db } from "@prive-admin-tanstack/db"
import { customer } from "@prive-admin-tanstack/db/schema/customer"
import { createServerFn } from "@tanstack/react-start"
import { eq } from "drizzle-orm"
import { z } from "zod"

import { requireAuthMiddleware } from "@/middleware/auth"
import { customerSchema } from "@/lib/schemas"

export const getCustomers = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .handler(async () => {
    return db.query.customer.findMany({
      orderBy: (customer, { asc }) => [asc(customer.name)],
    })
  })

export const getCustomer = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    const result = await db.query.customer.findFirst({
      where: eq(customer.id, data.id),
    })
    if (!result) {
      throw new Error("Customer not found")
    }
    return result
  })

export const createCustomer = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .validator(customerSchema)
  .handler(async ({ data }) => {
    const [result] = await db
      .insert(customer)
      .values({ name: data.name, phoneNumber: data.phoneNumber })
      .returning()
    return result
  })

export const updateCustomer = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .validator(customerSchema.required({ id: true }))
  .handler(async ({ data }) => {
    const [result] = await db
      .update(customer)
      .set({ name: data.name, phoneNumber: data.phoneNumber })
      .where(eq(customer.id, data.id!))
      .returning()
    return result
  })
