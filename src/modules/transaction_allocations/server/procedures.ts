import { z } from "zod";
import { TRPCError } from "@trpc/server";
import prisma from "@/lib/prisma";

import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { transactionAllocationSchema } from "@/lib/schemas";
import { Simulate } from "react-dom/test-utils";

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

      const allocations = await prisma.transactionAllocation.findMany({
        where: { appointmentId, orderId },
        include: {
          customer: includeCustomer,
          transaction: { include: { allocations: true } },
        },
      });

      const allocationsWithRemaining = allocations.map((allocation) => {
        const totalAllocated = allocation.transaction.allocations.reduce(
          (sum, alloc) => sum + alloc.amount,
          0,
        );

        const { allocations: _, ...rest } = allocation.transaction;
        void _;

        const remainingAllocation =
          allocation.transaction.amount - totalAllocated + allocation.amount;

        // Return a lean object with allocation fields, minimal transaction info, and the computed remaining allocation
        return {
          id: allocation.id,
          appointmentId: allocation.appointmentId,
          transactionId: allocation.transactionId,
          amount: allocation.amount,
          customer: allocation.customer,
          customerId: allocation.customerId,
          remainingAllocation,
          transaction: rest,
          // transaction: {
          //   id: allocation.transaction.id,
          //   amount: allocation.transaction.amount,
          // },
        };
      });

      return allocationsWithRemaining;
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
    .input(
      z.object({
        transactionAllocation: z.object({
          id: z.string().cuid2(),
          appointmentId: z.string().cuid2().nullish(),
          customerId: z.string().cuid2(),
          orderId: z.string().cuid2().nullish(),
          amount: z.number(),
        }),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { transactionAllocation } = input;

      const c = await prisma.transactionAllocation.update({
        data: {
          ...transactionAllocation,
          amount: transactionAllocation.amount
            ? transactionAllocation.amount
            : 0,
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
  allocateTransactions: protectedProcedure
    .input(
      z.object({
        transactionIds: z.array(z.string()),
        appointmentId: z.string().nullish(),
        orderId: z.string().nullish(),
        customerId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { transactionIds, appointmentId, orderId, customerId } = input;

      const transactionAllocations = transactionIds.map((transactionId) => ({
        transactionId,
        appointmentId,
        orderId,
        customerId,
        amount: 0,
      }));

      const c = await prisma.transactionAllocation.createMany({
        data: transactionAllocations,
      });

      return c;
    }),
});
