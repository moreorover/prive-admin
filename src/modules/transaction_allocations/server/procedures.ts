import { z } from "zod";
import { TRPCError } from "@trpc/server";
import prisma from "@/lib/prisma";

import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { transactionAllocationSchema } from "@/lib/schemas";

export const transactionAllocationsRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const transactions = await prisma.transactionAllocation.findMany({
      include: { order: true, customer: true },
    });

    return transactions;
  }),
  getOne: protectedProcedure
    .input(z.object({ id: z.string().cuid2() }))
    .query(async ({ input, ctx }) => {
      const { id } = input;

      const transaction = await prisma.transactionAllocation.findUnique({
        where: { id },
      });

      if (!transaction) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return transaction;
    }),
  getByAppointmentAndOrderId: protectedProcedure
    .input(
      z.object({
        appointmentId: z.string().cuid2().nullish(),
        orderId: z.string().cuid2().nullish(),
        includeCustomer: z.boolean(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { appointmentId, orderId, includeCustomer } = input;

      return prisma.transactionAllocation.findMany({
        where: { appointmentId, orderId },
        include: { customer: includeCustomer },
      });
    }),
  create: protectedProcedure
    .input(z.object({ transactionAllocation: transactionAllocationSchema }))
    .mutation(async ({ input, ctx }) => {
      const { transactionAllocation } = input;

      const c = await prisma.transactionAllocation.create({
        data: {
          amount: transactionAllocation.amount,
          appointmentId: transactionAllocation.appointmentId,
          orderId: transactionAllocation.orderId,
          transactionId: transactionAllocation.transactionId,
          customerId: transactionAllocation.customerId,
        },
      });

      return c;
    }),
  update: protectedProcedure
    .input(z.object({ transactionAllocation: transactionAllocationSchema }))
    .mutation(async ({ input, ctx }) => {
      const { transactionAllocation } = input;

      const c = await prisma.transactionAllocation.update({
        data: {
          amount: transactionAllocation.amount,
        },
        where: { id: transactionAllocation.id },
      });

      return c;
    }),
  delete: protectedProcedure
    .input(z.object({ transactionAllocationId: z.string().cuid2() }))
    .mutation(async ({ input, ctx }) => {
      const { transactionAllocationId } = input;

      const c = await prisma.transactionAllocation.delete({
        where: { id: transactionAllocationId },
      });

      return c;
    }),
});
