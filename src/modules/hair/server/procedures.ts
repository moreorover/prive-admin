import { z } from "zod";
import prisma from "@/lib/prisma";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { hairSchema } from "@/lib/schemas";
import { TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client";

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

      const hairOrder = await prisma.hairOrder.findUnique({
        where: { id: hairOrderId },
      });

      if (!hairOrder) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const newHair = await prisma.hair.create({
        data: {
          ...hair,
          weightReceived: hair.weight,
          hairOrderId,
        },
      });

      const hairOrderTransactions = await prisma.transaction.findMany({
        where: { hairOrderId },
        select: { amount: true },
      });

      const transactionsTotal = hairOrderTransactions.reduce(
        (sum, transaction) => sum + transaction.amount,
        0,
      );

      const hairOrderHair = await prisma.hair.findMany({
        where: { hairOrderId },
      });

      const hairTotalWeight = hairOrderHair.reduce(
        (sum, h) => sum + h.weight,
        0,
      );

      if (transactionsTotal === 0) {
        await prisma.hairOrder.update({
          data: { pricePerGram: 0 },
          where: { id: hairOrderId },
        });

        await Promise.all(
          hairOrderHair.map((hoh) =>
            prisma.hair.update({
              data: { price: 0 },
              where: { id: hoh.id },
            }),
          ),
        );
      }

      if (hairTotalWeight > 0 && transactionsTotal > 0) {
        const hairPricePerGram = +(transactionsTotal / hairTotalWeight).toFixed(
          2,
        );

        await prisma.hairOrder.update({
          data: { pricePerGram: hairPricePerGram * 100 },
          where: { id: hairOrderId },
        });

        await Promise.all(
          hairOrderHair.map((hoh) =>
            prisma.hair.update({
              data: { price: hoh.weight * hairPricePerGram * 100 },
              where: { id: hoh.id },
            }),
          ),
        );
      }

      return newHair;
    }),
  update: protectedProcedure
    .input(z.object({ hair: hairSchema }))
    .mutation(async ({ input }) => {
      const { hair } = input;

      const previousHair = await prisma.hair.findUnique({
        where: { id: hair.id },
      });

      if (!previousHair) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

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

      if (previousHair.weight !== hair.weight) {
        const hairOrder = await prisma.hairOrder.findUnique({
          where: { id: previousHair.hairOrderId },
        });

        if (!hairOrder) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }

        const hairOrderTransactions = await prisma.transaction.findMany({
          where: { hairOrderId: previousHair.hairOrderId },
          select: { amount: true },
        });

        const transactionsTotal = hairOrderTransactions.reduce(
          (sum, transaction) => sum + transaction.amount,
          0,
        );

        const hairOrderHair = await prisma.hair.findMany({
          where: { hairOrderId: previousHair.hairOrderId },
        });

        const hairTotalWeight = hairOrderHair.reduce(
          (sum, h) => sum + h.weight,
          0,
        );

        if (transactionsTotal === 0) {
          await prisma.hairOrder.update({
            data: { pricePerGram: 0 },
            where: { id: previousHair.hairOrderId },
          });

          await Promise.all(
            hairOrderHair.map((hoh) =>
              prisma.hair.update({
                data: { price: 0 },
                where: { id: hoh.id },
              }),
            ),
          );
        }

        if (hairTotalWeight > 0 && transactionsTotal > 0) {
          const hairPricePerGram = +(
            transactionsTotal / hairTotalWeight
          ).toFixed(2);

          await prisma.hairOrder.update({
            data: { pricePerGram: hairPricePerGram * 100 },
            where: { id: previousHair.hairOrderId },
          });

          await Promise.all(
            hairOrderHair.map((hoh) =>
              prisma.hair.update({
                data: { price: hoh.weight * hairPricePerGram * 100 },
                where: { id: hoh.id },
              }),
            ),
          );
        }
      }
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

      const hairOrder = await prisma.hairOrder.findUnique({
        where: { id: c.hairOrderId },
      });

      if (!hairOrder) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const hairOrderTransactions = await prisma.transaction.findMany({
        where: { hairOrderId: c.hairOrderId },
        select: { amount: true },
      });

      const transactionsTotal = hairOrderTransactions.reduce(
        (sum, transaction) => sum + transaction.amount,
        0,
      );

      const hairOrderHair = await prisma.hair.findMany({
        where: { hairOrderId: c.hairOrderId },
      });

      const hairTotalWeight = hairOrderHair.reduce(
        (sum, h) => sum + h.weight,
        0,
      );

      if (transactionsTotal === 0) {
        await prisma.hairOrder.update({
          data: { pricePerGram: 0 },
          where: { id: c.hairOrderId },
        });

        await Promise.all(
          hairOrderHair.map((hoh) =>
            prisma.hair.update({
              data: { price: 0 },
              where: { id: hoh.id },
            }),
          ),
        );
      }

      if (hairTotalWeight > 0 && transactionsTotal > 0) {
        const hairPricePerGram = +(transactionsTotal / hairTotalWeight).toFixed(
          2,
        );

        await prisma.hairOrder.update({
          data: { pricePerGram: hairPricePerGram * 100 },
          where: { id: c.hairOrderId },
        });

        await Promise.all(
          hairOrderHair.map((hoh) =>
            prisma.hair.update({
              data: { price: hoh.weight * hairPricePerGram * 100 },
              where: { id: hoh.id },
            }),
          ),
        );
      }

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

      const remaped = hair.map((h) => ({ ...h, price: h.price / 100 }));

      return remaped;
    }),
  getAll: protectedProcedure
    .input(
      z.object({
        color: z.string().nullish(),
        description: z.string().nullish(),
        upc: z.string().nullish(),
        weight: z.number().min(0).nullish(),
        length: z.number().min(0).nullish(),
      }),
    )
    .query(async ({ input }) => {
      const { color, description, upc, weight, length } = input;

      const filters: Prisma.HairWhereInput = {}; // Strongly typed object

      if (color && color.trim() !== "") filters.color = { contains: color };
      if (description && description.trim() !== "")
        filters.description = { contains: description };
      if (upc && upc.trim() !== "") filters.upc = { contains: upc };
      if (weight) filters.weight = weight;
      if (length) filters.length = length;

      const hair = await prisma.hair.findMany({
        where: Object.keys(filters).length > 0 ? filters : undefined,
      });

      const remaped = hair.map((h) => ({ ...h, price: h.price / 100 }));

      return remaped;
    }),
  recalculatePrices: protectedProcedure
    .input(z.object({ hairOrderId: z.string().cuid2() }))
    .mutation(async ({ input }) => {
      const { hairOrderId } = input;

      const hairOrder = await prisma.hairOrder.findUnique({
        where: { id: hairOrderId },
      });

      if (!hairOrder) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const hairOrderTransactions = await prisma.transaction.findMany({
        where: { hairOrderId },
        select: { amount: true },
      });

      const transactionsTotal = hairOrderTransactions.reduce(
        (sum, transaction) => sum + transaction.amount,
        0,
      );

      const hairOrderHair = await prisma.hair.findMany({
        where: { hairOrderId },
      });

      const hairTotalWeight = hairOrderHair.reduce(
        (sum, h) => sum + h.weight,
        0,
      );

      if (transactionsTotal === 0) {
        await prisma.hairOrder.update({
          data: { pricePerGram: 0 },
          where: { id: hairOrderId },
        });

        await Promise.all(
          hairOrderHair.map((hoh) =>
            prisma.hair.update({
              data: { price: 0 },
              where: { id: hoh.id },
            }),
          ),
        );
      }

      if (hairTotalWeight > 0 && transactionsTotal > 0) {
        const hairPricePerGram = +(transactionsTotal / hairTotalWeight).toFixed(
          2,
        );

        await prisma.hairOrder.update({
          data: { pricePerGram: hairPricePerGram * 100 },
          where: { id: hairOrderId },
        });

        await Promise.all(
          hairOrderHair.map((hoh) =>
            prisma.hair.update({
              data: { price: hoh.weight * hairPricePerGram * 100 },
              where: { id: hoh.id },
            }),
          ),
        );
      }

      return hairOrder;
    }),
});
