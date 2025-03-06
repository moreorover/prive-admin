import prisma from "@/lib/prisma";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { z } from "zod";
import { TRPCError } from "@trpc/server";

export const hairOrderRouter = createTRPCRouter({
  getAll: protectedProcedure.query(() => {
    return prisma.hairOrder.findMany({ include: { createdBy: true } });
  }),
  getById: protectedProcedure
    .input(z.object({ id: z.string().cuid2() }))
    .query(async ({ input }) => {
      const { id } = input;
      const c = await prisma.hairOrder.findFirst({
        include: { createdBy: true },
        where: { id },
      });

      if (!c) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return c;
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
});
