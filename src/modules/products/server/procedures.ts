import prisma from "@/lib/prisma";

import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { productSchema } from "@/lib/schemas";

export const productsRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return prisma.product.findMany();
  }),
  getOne: protectedProcedure
    .input(z.object({ id: z.string().cuid2() }))
    .query(async ({ input, ctx }) => {
      const { id } = input;

      const product = await prisma.product.findUnique({
        where: { id },
        include: { variants: true },
      });

      if (!product) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return product;
    }),
  create: protectedProcedure
    .input(z.object({ product: productSchema }))
    .mutation(async ({ input, ctx }) => {
      const { product } = input;

      const c = await prisma.product.create({
        data: { name: product.name, description: product.description },
      });

      return c;
    }),
  update: protectedProcedure
    .input(z.object({ product: productSchema }))
    .mutation(async ({ input, ctx }) => {
      const { product } = input;

      const c = await prisma.product.update({
        data: { name: product.name, description: product.description },
        where: { id: product.id },
      });

      return c;
    }),
});
