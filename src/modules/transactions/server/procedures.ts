import { z } from "zod";
import { TRPCError } from "@trpc/server";
import prisma from "@/lib/prisma";

import { createTRPCRouter, protectedProcedure } from "@/trpc/init";

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
    .input(z.object({ appointmentId: z.string().cuid2().nullable() }))
    .query(async ({ input, ctx }) => {
      const { appointmentId } = input;

      return prisma.transaction.findMany({
        where: { appointmentId },
      });
    }),
});
