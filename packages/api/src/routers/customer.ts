import { db } from "@prive-admin/db";
import {
  customer,
  customerCreateSchema,
  customerUpdateSchema,
} from "@prive-admin/db/schema/customer";
import { entityHistory } from "@prive-admin/db/schema/entityHistory";
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
    // Validate input - requires customerId as string
    .input(z.object({ customerId: z.string() }))
    .query(async ({ input }) => {
      // Fetch all history records for this customer from unified history table
      // Filter by entity type "customer" and the specific customer ID
      // Sort by most recent first (newest changes at top)
      // Include user details who made each change via relation
      const records = await db.query.entityHistory.findMany({
        where: and(
          eq(entityHistory.entityType, "customer"),
          eq(entityHistory.entityId, input.customerId),
        ),
        orderBy: desc(entityHistory.changedAt),
        with: {
          changedBy: {
            columns: { id: true, name: true, email: true },
          },
        },
      });

      // Group records by user and timestamp
      // Since updates happen in transactions, all field changes from one update
      // will have the exact same timestamp and user
      // We group them to show as a single "edit event" in the UI
      const grouped = records.reduce(
        (acc, record) => {
          // Create unique key from userId and timestamp
          // This ensures changes from same user at same time are grouped together
          const key = `${record.changedById}-${record.changedAt}`;

          // If this key doesn't exist yet, create a new group
          if (!acc[key]) {
            acc[key] = {
              changedBy: record.changedBy, // User who made the change
              changedAt: record.changedAt, // When the change happened
              changes: [], // Array to hold all field changes in this group
            };
          }

          // Add this field change to the group
          acc[key].changes.push({
            fieldName: record.fieldName, // Which field was changed (name, phoneNumber, etc)
            oldValue: record.oldValue, // Previous value
            newValue: record.newValue, // New value
          });

          return acc;
        },
        {} as Record<string, any>,
      );

      // Convert grouped object to array for easier iteration in UI
      // Each array item represents one "edit session" with multiple field changes
      return Object.values(grouped);
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

      // Wrap everything in a transaction
      // If any operation fails, all changes are rolled back
      return db.transaction(async (tx) => {
        // Fetch existing customer record
        const existing = await tx.query.customer.findFirst({
          where: eq(customer.id, input.id),
        });

        if (!existing) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Customer not found.",
          });
        }

        // Track name change in unified history table if changed
        if (input.name && input.name !== existing.name) {
          await tx.insert(entityHistory).values({
            entityType: "customer",
            entityId: input.id,
            changedById: ctx.session.user.id,
            fieldName: "name",
            oldValue: existing.name,
            newValue: input.name,
          });
        }

        // Track phone number change in unified history table if changed
        if (
          input.phoneNumber !== undefined &&
          input.phoneNumber !== existing.phoneNumber
        ) {
          await tx.insert(entityHistory).values({
            entityType: "customer",
            entityId: input.id,
            changedById: ctx.session.user.id,
            fieldName: "phoneNumber",
            oldValue: existing.phoneNumber,
            newValue: input.phoneNumber,
          });
        }

        // Update the customer record
        // If this fails, history inserts above are rolled back
        return tx.update(customer).set(input).where(eq(customer.id, input.id));
      });
    }),
});
