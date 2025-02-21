import { z } from "zod";
import { TRPCError } from "@trpc/server";
import prisma from "@/lib/prisma";

import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { transactionSchema } from "@/lib/schemas";

export const transactionsRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const transactions = await prisma.transaction.findMany({
      include: {
        customer: true,
      },
    });

    return transactions;
  }),
  getOne: protectedProcedure
    .input(z.object({ id: z.string().cuid2() }))
    .query(async ({ input, ctx }) => {
      const { id } = input;

      const transaction = await prisma.transaction.findUnique({
        where: { id },
      });

      if (!transaction) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return transaction;
    }),
  getManyByAppointmentId: protectedProcedure
    .input(
      z.object({
        appointmentId: z.string().cuid2().nullable(),
        includeCustomer: z.boolean(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { appointmentId, includeCustomer } = input;

      return prisma.transaction.findMany({
        where: { appointmentId },
        include: { customer: includeCustomer },
      });
    }),
  getByOrderId: protectedProcedure
    .input(
      z.object({
        orderId: z.string().cuid2().nullable(),
        includeCustomer: z.boolean(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { orderId, includeCustomer } = input;

      return prisma.transaction.findMany({
        where: { orderId },
        include: { customer: includeCustomer },
      });
    }),
  createTransaction: protectedProcedure
    .input(z.object({ transaction: transactionSchema }))
    .mutation(async ({ input, ctx }) => {
      const { transaction } = input;

      const c = await prisma.transaction.create({
        data: {
          name: transaction.name,
          notes: transaction.notes,
          amount: transaction.amount * 100,
          type: transaction.type,
          appointmentId: transaction.appointmentId,
          orderId: transaction.orderId,
          customerId: transaction.customerId,
        },
      });

      return c;
    }),
  update: protectedProcedure
    .input(z.object({ transaction: transactionSchema }))
    .mutation(async ({ input, ctx }) => {
      const { transaction } = input;

      const c = await prisma.transaction.update({
        data: {
          name: transaction.name,
          notes: transaction.notes,
          amount: transaction.amount * 100,
          type: transaction.type,
          appointmentId: transaction.appointmentId,
          orderId: transaction.orderId,
          customerId: transaction.customerId,
        },
        where: { id: transaction.id },
      });

      return c;
    }),
  createTransactions: protectedProcedure
    .input(z.object({ transactions: z.array(transactionSchema) }))
    .mutation(async ({ input, ctx }) => {
      const { transactions } = input;

      const c = await prisma.transaction.createMany({
        data: transactions,
        skipDuplicates: true,
      });

      return c;
    }),
  linkTransactionsWithAppointment: protectedProcedure
    .input(
      z.object({
        transactions: z.array(z.string()),
        appointmentId: z.string(),
        customerId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { transactions, appointmentId, customerId } = input;

      const c = await prisma.transaction.updateMany({
        where: { id: { in: transactions } },
        data: {
          appointmentId,
          customerId,
        },
      });

      return c;
    }),
  setAppointmentId: protectedProcedure
    .input(
      z.object({
        transactionId: z.string(),
        appointmentId: z.string().nullable(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { transactionId, appointmentId } = input;

      const c = await prisma.transaction.update({
        where: { id: transactionId },
        data: { appointmentId },
      });

      return c;
    }),
  delete: protectedProcedure
    .input(
      z.object({
        id: z.string().refine(
          (val) => {
            if (!val) return true; // Allow undefined
            // Check if it's a valid cuid2 or starts with "mm_"
            return (
              z.string().cuid2().safeParse(val).success ||
              val.startsWith("mm_") ||
              val.startsWith("pp_")
            );
          },
          { message: "id must be a valid cuid2 or start with 'mm_'" },
        ),
      }),
    )
    .mutation(async ({ input, ctx }) => {
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
