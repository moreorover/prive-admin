import prisma from "@/lib/prisma";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { hairOrderSchema } from "@/lib/schemas";

export const hairOrderRouter = createTRPCRouter({
  getAll: protectedProcedure.query(() => {
    return prisma.hairOrder.findMany({ include: { createdBy: true } });
  }),
  getById: protectedProcedure
    .input(z.object({ id: z.string().cuid2() }))
    .query(async ({ input }) => {
      const { id } = input;
      const hairOrder = await prisma.hairOrder.findFirst({
        where: { id },
        include: { createdBy: true, customer: true },
      });

      if (!hairOrder) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return { ...hairOrder, pricePerGram: hairOrder.pricePerGram / 100 };
    }),
  create: protectedProcedure.mutation(async ({ ctx }) => {
    const { user } = ctx;
    const c = await prisma.hairOrder.create({
      data: {
        createdById: user.id,
      },
    });
    return c;
  }),
  update: protectedProcedure
    .input(z.object({ hairOrder: hairOrderSchema }))
    .mutation(async ({ input }) => {
      const { hairOrder } = input;
      const c = await prisma.hairOrder.update({
        data: hairOrder,
        where: { id: hairOrder.id },
      });
      return c;
    }),
});
