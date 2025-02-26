import prisma from "@/lib/prisma";

import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { z } from "zod";
import { productVariantSchema } from "@/lib/schemas";

export const productVariantsRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        productVariant: productVariantSchema,
        productId: z.string().cuid2(),
      }),
    )
    .mutation(async ({ input }) => {
      const { productVariant, productId } = input;

      const c = await prisma.productVariant.create({
        data: {
          productId,
          size: productVariant.size,
          price: productVariant.price,
        },
      });

      return c;
    }),
  update: protectedProcedure
    .input(z.object({ productVariant: productVariantSchema }))
    .mutation(async ({ input }) => {
      const { productVariant } = input;

      const c = await prisma.productVariant.update({
        data: { size: productVariant.size, price: productVariant.price },
        where: { id: productVariant.id },
      });

      return c;
    }),
});
