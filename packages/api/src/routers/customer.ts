import { db } from "@prive-admin/db";
import {
  customer,
  customerCreateSchema,
  customerUpdateSchema,
} from "@prive-admin/db/schema/customer";
import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import z from "zod";
import { protectedProcedure, router } from "../index";

export const customerRouter = router({
  getAll: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).catch(1).default(1),
        pageSize: z.coerce
          .number()
          .min(10)
          .max(100)
          .transform((v) => ([10, 20, 30, 50, 100].includes(v) ? v : 10))
          .catch(10)
          .default(10),
        sortBy: z
          .string()
          .refine(
            (val) => {
              if (!val) return true; // optional field
              const [field, order] = val.split(".");
              if (!field || !order) return false;
              const validFields = ["name", "phoneNumber"];
              const validOrders = ["asc", "desc"];
              return validFields.includes(field) && validOrders.includes(order);
            },
            {
              message:
                'sortBy must be in format "field.order" where field is name or phoneNumber and order is asc or desc',
            },
          )
          .optional(),
        filter: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      const { page, pageSize, sortBy, filter } = input;

      // Build where conditions
      const whereConditions = [];
      if (filter) {
        whereConditions.push(
          or(
            ilike(customer.name, `%${filter}%`),
            ilike(customer.phoneNumber, `%${filter}%`),
          ),
        );
      }

      // Determine order by from sortBy format "field.asc" or "field.desc"
      const getOrderBy = () => {
        if (!sortBy) return asc(customer.name); // default sort

        const [field, order] = sortBy.split(".");
        const column =
          field === "phoneNumber" ? customer.phoneNumber : customer.name;
        return order === "desc" ? desc(column) : asc(column);
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
          page: page,
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
