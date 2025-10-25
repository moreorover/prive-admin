import { db } from "@prive-admin/db";
import {
  customer,
  customerCreateSchema,
  customerHistory,
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

  getHistory: protectedProcedure
    // Define input schema - expects an object with customerId as a string
    .input(z.object({ customerId: z.string() }))
    .query(async ({ input }) => {
      // Fetch all history records for this customer from database
      // Order by most recent first (descending changedAt timestamp)
      // Include the user who made each change (join with user table)
      const records = await db.query.customerHistory.findMany({
        where: eq(customerHistory.customerId, input.customerId),
        orderBy: desc(customerHistory.changedAt),
        with: {
          changedBy: {
            columns: { id: true, name: true, email: true },
          },
        },
      });

      // Define the grouped result structure
      // Each group represents one "edit session" - multiple field changes
      // made by the same user within 5 seconds of each other
      const grouped: Array<{
        changedBy: { id: string; name: string; email: string };
        changedAt: Date;
        changes: Array<{
          fieldName: string;
          oldValue: string | null;
          newValue: string | null;
        }>;
      }> = [];

      // Loop through each database record to group them
      for (const record of records) {
        // Convert timestamp to milliseconds for time comparison
        const recordTime = new Date(record.changedAt).getTime();

        // Try to find an existing group that matches:
        // 1. Same user (changedById matches)
        // 2. Within 5 seconds (5000ms) of this record
        const existingGroup = grouped.find(
          (group) =>
            group.changedBy.id === record.changedById &&
            Math.abs(new Date(group.changedAt).getTime() - recordTime) <= 5000,
        );

        // If found a matching group, add this change to it
        if (existingGroup) {
          existingGroup.changes.push({
            fieldName: record.fieldName,
            oldValue: record.oldValue,
            newValue: record.newValue,
          });
        } else {
          // No matching group found - create a new group
          // This represents a new "edit session"
          grouped.push({
            changedBy: record.changedBy,
            changedAt: record.changedAt,
            changes: [
              {
                fieldName: record.fieldName,
                oldValue: record.oldValue,
                newValue: record.newValue,
              },
            ],
          });
        }
      }

      // Return grouped data ready for UI rendering
      // UI doesn't need to do any processing
      return grouped;
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

      const existing = await db.query.customer.findFirst({
        where: eq(customer.id, input.id),
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Customer not found.",
        });
      }

      if (input.name && input.name !== existing.name) {
        await db.insert(customerHistory).values({
          customerId: input.id,
          changedById: ctx.session.user.id,
          fieldName: "name",
          oldValue: existing.name,
          newValue: input.name,
        });
      }

      if (
        input.phoneNumber !== undefined &&
        input.phoneNumber !== existing.phoneNumber
      ) {
        await db.insert(customerHistory).values({
          customerId: input.id,
          changedById: ctx.session.user.id,
          fieldName: "phoneNumber",
          oldValue: existing.phoneNumber,
          newValue: input.phoneNumber,
        });
      }

      return db.update(customer).set(input).where(eq(customer.id, input.id));
    }),
});
