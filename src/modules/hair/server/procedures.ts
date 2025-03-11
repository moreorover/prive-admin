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
        (sum, h) => sum + h.weightReceived,
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
              data: { price: hoh.weightReceived * hairPricePerGram * 100 },
              where: { id: hoh.id },
            }),
          ),
        );
      }

      return newHair;
    }),
  createBlankHair: protectedProcedure.mutation(async () => {
    const letters = "ABCDFGHKLMNOPQRSTUVWXYZ";
    let upc = "";
    for (let i = 0; i < 5; i++) {
      upc += letters.charAt(Math.floor(Math.random() * letters.length));
    }

    const createdHair = await prisma.hair.create({
      data: {
        color: "",
        description: "",
        weight: 0,
        weightReceived: 0,
        length: 0,
        hairOrderId: undefined,
        upc: `p+${upc}`,
        price: 0,
      },
    });

    return createdHair;
  }),
  update: protectedProcedure
    .input(
      z.object({
        hair: z.object({
          id: z.string().cuid2(),
          color: z.string().optional(),
          description: z.string().optional(),
          upc: z.string().optional(),
          length: z.number().positive().max(150).optional(),
          weight: z.number().positive().max(10000).optional(),
          price: z.number().default(0).optional(),
        }),
      }),
    )
    .mutation(async ({ input }) => {
      const { hair } = input;

      const previousHair = await prisma.hair.findUnique({
        where: { id: hair.id },
      });

      if (!previousHair) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const c = await prisma.hair.update({
        data: hair,
        where: {
          id: hair.id,
        },
      });

      if (previousHair.hairOrderId && previousHair.weight !== hair.weight) {
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
          (sum, h) => sum + h.weightReceived,
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
                data: { price: hoh.weightReceived * hairPricePerGram * 100 },
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

      if (!c.hairOrderId) return c;

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
        (sum, h) => sum + h.weightReceived,
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
              data: { price: hoh.weightReceived * hairPricePerGram * 100 },
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
        weightReceived: z.number().min(0).nullish(),
        length: z.number().min(0).nullish(),
      }),
    )
    .query(async ({ input }) => {
      const { color, description, upc, weight, weightReceived, length } = input;

      const filters: Prisma.HairWhereInput = {}; // Strongly typed object

      if (color && color.trim() !== "") filters.color = { contains: color };
      if (description && description.trim() !== "")
        filters.description = { contains: description };
      if (upc && upc.trim() !== "") filters.upc = { contains: upc };
      if (weight) filters.weight = weight;
      if (weightReceived) filters.weightReceived = weightReceived;
      if (length) filters.length = length;

      const hair = await prisma.hair.findMany({
        where: Object.keys(filters).length > 0 ? filters : undefined,
      });

      const remaped = hair.map((h) => ({ ...h, price: h.price / 100 }));

      return remaped;
    }),
  getById: protectedProcedure
    .input(
      z.object({
        hairId: z.string().cuid2(),
      }),
    )
    .query(async ({ input }) => {
      const { hairId } = input;

      const hair = await prisma.hair.findUnique({
        where: { id: hairId },
      });

      if (!hair) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return { ...hair, price: hair.price / 100 };
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
        (sum, h) => sum + h.weightReceived,
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
              data: { price: hoh.weightReceived * hairPricePerGram * 100 },
              where: { id: hoh.id },
            }),
          ),
        );
      }

      return hairOrder;
    }),
});
