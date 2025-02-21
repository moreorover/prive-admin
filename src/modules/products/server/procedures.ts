import prisma from "@/lib/prisma";

import { createTRPCRouter, protectedProcedure } from "@/trpc/init";

export const productsRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return prisma.product.findMany();
  }),
});
