import { z } from "zod";
import { TRPCError } from "@trpc/server";
import prisma from "@/lib/prisma";

import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { transactionIdSchema, transactionSchema } from "@/lib/schemas";
import dayjs from "dayjs";

export const transactionsRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({}) => {
    const transactions = await prisma.transaction.findMany();

    return transactions;
  }),
  getAllTransactionsWithAllocations: protectedProcedure.query(async ({}) => {
    const transactions = await prisma.transaction.findMany({
      include: {
        allocations: { include: { customer: true } }, // Include related allocations
      },
    });

    // Transform data to include allocated and remaining amounts
    const transactionsWithComputedFields = transactions.map((transaction) => {
      const allocatedAmount = transaction.allocations.reduce(
        (sum, alloc) => sum + alloc.amount,
        0,
      );
      const remainingAmount = transaction.amount - allocatedAmount;

      return {
        ...transaction,
        allocatedAmount,
        remainingAmount,
      };
    });

    return transactionsWithComputedFields;
  }),
  getTransactionsBetweenDates: protectedProcedure
    .input(z.object({ startDate: z.string(), endDate: z.string() }))
    .query(async ({ input }) => {
      const { startDate, endDate } = input;
      const startOfWeek = dayjs(startDate);
      const endOfWeek = dayjs(endDate); // Sunday end

      const transactions = await prisma.transaction.findMany({
        where: {
          createdAt: {
            gte: startOfWeek.toDate(),
            lte: endOfWeek.toDate(),
          },
        },
        orderBy: {
          createdAt: "asc",
        },
        include: {
          allocations: { include: { customer: true } }, // Include related allocations
        },
      });

      // Transform data to include allocated and remaining amounts
      const transactionsWithComputedFields = transactions.map((transaction) => {
        const allocatedAmount = transaction.allocations.reduce(
          (sum, alloc) => sum + alloc.amount,
          0,
        );
        const remainingAmount = transaction.amount - allocatedAmount;

        return {
          ...transaction,
          allocatedAmount,
          remainingAmount,
        };
      });

      return transactionsWithComputedFields;
    }),
  getTransactionOptions: protectedProcedure.query(async ({}) => {
    const transactions = await prisma.transaction.findMany({
      include: {
        allocations: true, // Fetch allocations for each transaction
      },
    });

    const unallocatedTransactions = transactions.filter((transaction) => {
      const totalAllocated = transaction.allocations.reduce(
        (sum, alloc) => sum + alloc.amount,
        0,
      );
      return totalAllocated !== transaction.amount; // Only keep transactions with unallocated amount
    });

    return unallocatedTransactions;
  }),
  getOne: protectedProcedure
    .input(z.object({ id: z.string().cuid2() }))
    .query(async ({ input }) => {
      const { id } = input;

      const transaction = await prisma.transaction.findUnique({
        where: { id },
      });

      if (!transaction) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return transaction;
    }),
  getByOrderId: protectedProcedure
    .input(
      z.object({
        orderId: z.string().cuid2().nullable(),
        includeCustomer: z.boolean(),
      }),
    )
    .query(async ({ input }) => {
      const { orderId, includeCustomer } = input;

      return prisma.transaction.findMany({
        where: {
          allocations: {
            some: {
              orderId,
            },
          },
        },
        include: {
          allocations: { include: { customer: includeCustomer } },
        },
      });
    }),
  createTransaction: protectedProcedure
    .input(
      z.object({
        transaction: transactionSchema,
        appointmentId: z.string().cuid2().nullish(),
        orderId: z.string().cuid2().nullish(),
        customerId: z.string().cuid2(),
      }),
    )
    .mutation(async ({ input }) => {
      const { transaction, appointmentId, orderId, customerId } = input;

      const c = await prisma.transaction.create({
        data: {
          name: transaction.name,
          notes: transaction.notes,
          amount: transaction.amount,
          type: transaction.type,
        },
      });

      if (transaction.type === "CASH") {
        await prisma.transactionAllocation.create({
          data: {
            transactionId: c.id,
            orderId,
            appointmentId,
            customerId,
            amount: transaction.amount,
          },
        });
      }

      return c;
    }),
  update: protectedProcedure
    .input(z.object({ transaction: transactionSchema }))
    .mutation(async ({ input }) => {
      const { transaction } = input;

      const c = await prisma.transaction.update({
        data: {
          name: transaction.name,
          notes: transaction.notes,
          amount: transaction.amount,
          type: transaction.type,
        },
        where: { id: transaction.id },
      });

      return c;
    }),
  createTransactions: protectedProcedure
    .input(z.object({ transactions: z.array(transactionSchema) }))
    .mutation(async ({ input }) => {
      const { transactions } = input;

      // const transactionBatch = await prisma.transactionBatch.create({
      //   data: {
      //     transactions: { createMany: { data: transactions } },
      //   },
      // });

      const transactionBatch = await prisma.transactionBatch.create({
        data: {},
      });

      const transactionsWithBatch = transactions.map((transaction) => ({
        ...transaction,
        batchId: transactionBatch.id,
      }));

      const c = await prisma.transaction.createMany({
        data: transactionsWithBatch,
        skipDuplicates: true,
      });

      return c;
    }),
  delete: protectedProcedure
    .input(
      z.object({
        id: transactionIdSchema,
      }),
    )
    .mutation(async ({ input }) => {
      const { id } = input;

      const transaction = await prisma.transaction.findUnique({
        where: { id },
      });

      if (!transaction) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      if (transaction.type !== "CASH") {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Can not delete transaction that is no type of CASH!",
        });
      }

      const c = await prisma.transaction.delete({
        where: { id },
      });

      return c;
    }),
});
