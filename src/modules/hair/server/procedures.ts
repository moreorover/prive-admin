import { z } from "zod";
import prisma from "@/lib/prisma";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { hairSchema } from "@/lib/schemas";

export const hairRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        hairOrderId: z.string().cuid2(),
        hair: hairSchema,
      }),
    )
    .mutation(async ({ input }) => {
      const { hairOrderId, hair } = input;

      const c = await prisma.hair.create({
        data: {
          ...hair,
          weightReceived: hair.weight,
          hairOrderId,
        },
      });
      return c;
    }),
  update: protectedProcedure
    .input(z.object({ hair: hairSchema }))
    .mutation(async ({ input }) => {
      const { hair } = input;

      const c = await prisma.hair.update({
        data: {
          color: hair.color,
          description: hair.description,
          upc: hair.upc,
          length: hair.length,
          weightReceived: hair.weight,
          weight: hair.weight,
        },
        where: {
          id: hair.id,
        },
      });
      return c;
    }),
  delete: protectedProcedure
    .input(z.object({ hairId: z.string().cuid2() }))
    .mutation(async ({ input }) => {
      const { hairId } = input;

      const c = await prisma.hair.delete({
        where: {
          id: hairId,
        },
      });
      return c;
    }),
  getByHairOrderId: protectedProcedure
    .input(z.object({ hairOrderId: z.string().cuid2() }))
    .query(async ({ input }) => {
      const { hairOrderId } = input;

      const hair = await prisma.hair.findMany({
        where: {
          hairOrderId,
        },
      });

      return hair;
    }),
});
