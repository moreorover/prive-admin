import { z } from "zod";
import { TRPCError } from "@trpc/server";
import prisma from "@/lib/prisma";

import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { transactionSchema } from "@/lib/schemas";

export const transactionsRouter = createTRPCRouter({
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
});
