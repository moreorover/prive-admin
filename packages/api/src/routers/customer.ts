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
import { trackFieldChange } from "../lib/history";

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
              if (!val) return true;
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

      const whereConditions = [];
      if (filter) {
        whereConditions.push(
          or(
            ilike(customer.name, `%${filter}%`),
            ilike(customer.phoneNumber, `%${filter}%`),
          ),
        );
      }

      const getOrderBy = () => {
        if (!sortBy) return asc(customer.name);

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
        with: {
          createdBy: {
            columns: { id: true, name: true, email: true },
          },
        },
      });

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

  getById: protectedProcedure
    .input(z.object({ customerId: z.string() }))
    .query(async ({ input }) => {
      return db.query.customer.findFirst({
        where: eq(customer.id, input.customerId),
        with: {
          createdBy: {
            columns: { id: true, name: true, email: true },
          },
        },
      });
    }),

  create: protectedProcedure
    .input(customerCreateSchema)
    .mutation(async ({ input, ctx }) => {
      return db.insert(customer).values({
        name: input.name,
        phoneNumber: input.phoneNumber,
        createdById: ctx.session.user.id,
      });
    }),

  update: protectedProcedure
    .input(customerUpdateSchema)
    .mutation(async ({ input, ctx }) => {
      if (!input.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "ID is not valid.",
        });
      }

      return db.transaction(async (tx) => {
        const existing = await tx.query.customer.findFirst({
          where: eq(customer.id, input.id),
        });

        if (!existing) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Customer not found.",
          });
        }

        // Track name change if changed
        if (input.name && input.name !== existing.name) {
          await trackFieldChange(
            tx,
            "customer",
            input.id,
            ctx.session.user.id,
            "name",
            existing.name,
            input.name,
          );
        }

        // Track phone number change if changed
        if (
          input.phoneNumber !== undefined &&
          input.phoneNumber !== existing.phoneNumber
        ) {
          await trackFieldChange(
            tx,
            "customer",
            input.id,
            ctx.session.user.id,
            "phoneNumber",
            existing.phoneNumber,
            input.phoneNumber,
          );
        }

        return tx.update(customer).set(input).where(eq(customer.id, input.id));
      });
    }),
});
