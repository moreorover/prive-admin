import { db } from "@prive-admin-tanstack/db"
import { bill } from "@prive-admin-tanstack/db/schema/bill"
import { createServerFn } from "@tanstack/react-start"
import { eq } from "drizzle-orm"
import { z } from "zod"

import { billSchema } from "@/lib/schemas"
import { requireAuthMiddleware } from "@/middleware/auth"

export const listBills = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .inputValidator(z.object({ legalEntityId: z.string().optional() }).optional())
  .handler(async ({ data }) => {
    return db.query.bill.findMany({
      where: data?.legalEntityId ? eq(bill.legalEntityId, data.legalEntityId) : undefined,
      with: { legalEntity: true },
      orderBy: (b, { asc }) => [asc(b.name)],
    })
  })

export const getBill = createServerFn({ method: "GET" })
  .middleware([requireAuthMiddleware])
  .inputValidator(z.object({ id: z.string().min(1) }))
  .handler(async ({ data }) => {
    const row = await db.query.bill.findFirst({
      where: eq(bill.id, data.id),
      with: {
        legalEntity: true,
        transactions: {
          with: { bankAccount: true, customer: { columns: { id: true, name: true } } },
          orderBy: (t, { desc }) => [desc(t.completedDateBy)],
        },
      },
    })
    if (!row) throw new Error("Bill not found")
    return row
  })

export const createBill = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator(billSchema)
  .handler(async ({ data }) => {
    const [row] = await db.insert(bill).values({ legalEntityId: data.legalEntityId, name: data.name }).returning()
    return row
  })

export const updateBill = createServerFn({ method: "POST" })
  .middleware([requireAuthMiddleware])
  .inputValidator(billSchema.required({ id: true }))
  .handler(async ({ data }) => {
    const [row] = await db
      .update(bill)
      .set({ legalEntityId: data.legalEntityId, name: data.name })
      .where(eq(bill.id, data.id!))
      .returning()
    if (!row) throw new Error("Bill not found")
    return row
  })
