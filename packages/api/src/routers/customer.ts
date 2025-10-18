import { db } from "@prive-admin/db";
import {
  customer,
  customerCreateSchema,
  customerUpdateSchema,
} from "@prive-admin/db/schema/customer";
import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, ilike, sql } from "drizzle-orm";
import z from "zod";
import { protectedProcedure, router } from "../index";

export const customerRouter = router({
  getAll: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).catch(1).default(1),
        pageSize: z.coerce
          .number() // ensures "35" → 35
          .min(10)
          .max(100)
          .transform((v) => ([10, 20, 30, 50, 100].includes(v) ? v : 10))
          .catch(10) // handles completely invalid values like null, NaN, or undefined
          .default(10),
        sortBy: z.string().optional(),
        sortOrder: z.enum(["asc", "desc"]).optional(),
        name: z.string().optional(),
        phoneNumber: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      const { page, pageSize, sortBy, sortOrder, name, phoneNumber } = input;

      // Build where conditions
      const whereConditions = [];
      if (name) {
        whereConditions.push(ilike(customer.name, `%${name}%`));
      }
      if (phoneNumber) {
        whereConditions.push(ilike(customer.phoneNumber, `%${phoneNumber}%`));
      }

      // Determine order by
      const getOrderBy = () => {
        const column =
          sortBy === "phoneNumber" ? customer.phoneNumber : customer.name;
        return sortOrder === "desc" ? desc(column) : asc(column);
      };

      const customers = await db.query.customer.findMany({
        where: whereConditions.length > 0 ? and(...whereConditions) : undefined,
        orderBy: getOrderBy(),
        limit: pageSize,
        offset: (page - 1) * pageSize,
      });

      // Get total count for pagination
      const totalCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(customer)
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
        .then((result) => Number(result[0] ? result[0].count : 0));

      return {
        customers,
        pagination: {
          page: page - 1,
          pageSize,
          totalCount,
          totalPages: Math.ceil(totalCount / pageSize),
        },
      };
    }),

  create: protectedProcedure
    .input(customerCreateSchema)
    .mutation(async ({ input }) => {
      return db.insert(customer).values({
        name: input.name,
        phoneNumber: input.phoneNumber,
      });
    }),

  update: protectedProcedure
    .input(customerUpdateSchema)
    .mutation(async ({ input }) => {
      if (!input.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "ID is not valid.",
        });
      }
      return db.update(customer).set(input).where(eq(customer.id, input.id));
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return db.delete(customer).where(eq(customer.id, input.id));
    }),
});
