import { createAdminUserService, type AdminUsersApi } from "@prive-admin-tanstack/application/services"
import { auth } from "@prive-admin-tanstack/auth"
import { z } from "zod"

import { protectedProcedure, router } from "../index"
import { getOffset, pagedResult, pageSchema, searchSchema } from "../pagination"

const roleSchema = z.union([z.string().min(1), z.array(z.string().min(1)).min(1)])
const userIdSchema = z.object({ userId: z.string().min(1) })
// AppAuth is intentionally kept independent of plugin-specific endpoint types. The
// admin plugin is installed in the auth package, so this is the transport boundary.
const adminService = createAdminUserService(auth.api as unknown as AdminUsersApi)

const listSchema = pageSchema.extend({
  searchValue: searchSchema,
  searchField: z.enum(["email", "name"]).optional(),
  searchOperator: z.enum(["contains", "starts_with", "ends_with"]).optional(),
  sortBy: z.string().trim().min(1).max(64).optional(),
  sortDirection: z.enum(["asc", "desc"]).optional(),
  filterField: z.string().trim().min(1).max(64).optional(),
  filterValue: z.union([z.string(), z.number(), z.boolean(), z.array(z.string()), z.array(z.number())]).optional(),
  filterOperator: z
    .enum(["eq", "ne", "lt", "lte", "gt", "gte", "in", "not_in", "contains", "starts_with", "ends_with"])
    .optional(),
})

const createSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  name: z.string().trim().min(1),
  role: roleSchema.optional(),
})

const updateSchema = z.object({
  userId: z.string().min(1),
  data: z
    .object({
      name: z.string().trim().min(1).optional(),
      email: z.email().optional(),
      image: z.string().nullable().optional(),
    })
    .strict()
    .refine((data) => Object.keys(data).length > 0, "At least one field is required"),
})

export const adminUsersRouter = router({
  list: protectedProcedure.input(listSchema).query(async ({ ctx, input }) => {
    const result = await adminService.list({
      headers: ctx.headers,
      query: {
        limit: input.pageSize,
        offset: getOffset(input),
        searchValue: input.searchValue,
        searchField: input.searchField,
        searchOperator: input.searchOperator,
        sortBy: input.sortBy,
        sortDirection: input.sortDirection,
        filterField: input.filterField,
        filterValue: input.filterValue,
        filterOperator: input.filterOperator,
      },
    })
    return pagedResult(result.users, input, result.total)
  }),

  create: protectedProcedure
    .input(createSchema)
    .mutation(({ ctx, input }) => adminService.create({ headers: ctx.headers, body: input })),

  update: protectedProcedure
    .input(updateSchema)
    .mutation(({ ctx, input }) => adminService.update({ headers: ctx.headers, body: input })),

  remove: protectedProcedure
    .input(userIdSchema)
    .mutation(({ ctx, input }) => adminService.remove({ headers: ctx.headers, body: input })),

  ban: protectedProcedure
    .input(
      userIdSchema.extend({
        banReason: z.string().trim().max(500).optional(),
        banExpiresIn: z.number().int().positive().optional(),
      }),
    )
    .mutation(({ ctx, input }) => adminService.ban({ headers: ctx.headers, body: input })),

  unban: protectedProcedure
    .input(userIdSchema)
    .mutation(({ ctx, input }) => adminService.unban({ headers: ctx.headers, body: input })),

  setRole: protectedProcedure
    .input(userIdSchema.extend({ role: roleSchema }))
    .mutation(({ ctx, input }) => adminService.setRole({ headers: ctx.headers, body: input })),

  setPassword: protectedProcedure
    .input(userIdSchema.extend({ newPassword: z.string().min(8) }))
    .mutation(({ ctx, input }) => adminService.setPassword({ headers: ctx.headers, body: input })),
})
