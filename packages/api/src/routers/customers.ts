import { z } from "zod"

import {
  getCustomer,
  getCustomerSummary,
  listCustomers,
  createCustomer,
  updateCustomer,
} from "../../../application/src/services/customers"
import { toTrpcError } from "../errors"
import { protectedProcedure, router } from "../index"
import { pagedResult, pageSchema, searchSchema } from "../pagination"

const customerInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(5, "Name must be at least 5 characters long").max(50, "Name cannot exceed 50 characters"),
  phoneNumber: z
    .string()
    .min(10, "Phone number must be at least 10 characters long")
    .max(15, "Phone number must be at most 15 characters long")
    .regex(/^\+\d+$/, "Phone number must start with '+' and contain only digits after it")
    .nullish(),
})

const customerListSchema = pageSchema.extend({ search: searchSchema })

export const customersRouter = router({
  list: protectedProcedure.input(customerListSchema).query(async ({ input }) => {
    const { items, totalCount } = await listCustomers(input.search ?? undefined)
    return pagedResult(items, input, totalCount)
  }),

  get: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
    try {
      return await getCustomer(input.id)
    } catch (error) {
      throw toTrpcError(error)
    }
  }),

  create: protectedProcedure.input(customerInputSchema).mutation(async ({ input }) => {
    return await createCustomer({ name: input.name, phoneNumber: input.phoneNumber })
  }),

  update: protectedProcedure.input(customerInputSchema.required({ id: true })).mutation(async ({ input }) => {
    try {
      return await updateCustomer({ id: input.id, name: input.name, phoneNumber: input.phoneNumber })
    } catch (error) {
      throw toTrpcError(error)
    }
  }),

  summary: protectedProcedure.input(z.object({ id: z.string() })).query(async ({ input }) => {
    try {
      return await getCustomerSummary(input.id)
    } catch (error) {
      throw toTrpcError(error)
    }
  }),
})
