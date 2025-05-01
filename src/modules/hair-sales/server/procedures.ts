import prisma from "@/lib/prisma";
import { hairSaleSchema } from "@/lib/schemas";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

export const hairSalesRouter = createTRPCRouter({
	getAll: protectedProcedure.query(() => {
		return prisma.hairSale.findMany({
			include: { createdBy: true, customer: true },
			orderBy: { placedAt: "desc" },
		});
	}),
	getById: protectedProcedure
		.input(z.object({ hairSaleId: z.string().cuid2() }))
		.query(async ({ input }) => {
			const { hairSaleId } = input;

			const hairSale = await prisma.hairSale.findFirst({
				where: { id: hairSaleId },
				include: { createdBy: true, customer: true },
			});

			if (!hairSale) {
				throw new TRPCError({ code: "NOT_FOUND" });
			}

			return hairSale;
		}),
	getByCustomerId: protectedProcedure
		.input(z.object({ customerId: z.string().cuid2() }))
		.query(async ({ input }) => {
			const { customerId } = input;

			const hairSales = await prisma.hairSale.findMany({
				where: { customerId },
				include: { createdBy: true, customer: true },
				orderBy: { placedAt: "desc" },
			});

			return hairSales;
		}),
	create: protectedProcedure
		.input(z.object({ customerId: z.string().cuid2() }))
		.mutation(async ({ input, ctx }) => {
			const { customerId } = input;
			const { user } = ctx;

			const hairSale = await prisma.hairSale.create({
				data: { customerId, createdById: user.id },
			});

			return hairSale;
		}),
	update: protectedProcedure
		.input(z.object({ hairSale: hairSaleSchema }))
		.mutation(async ({ input }) => {
			const { hairSale } = input;

			console.log({ hairSale });

			const hairSaleUpdated = await prisma.hairSale.update({
				where: { id: hairSale.id },
				data: {
					placedAt: hairSale.placedAt,
					weightInGrams: hairSale.weightInGrams,
					pricePerGram: hairSale.pricePerGram,
				},
			});

			if (!hairSaleUpdated) {
				throw new TRPCError({ code: "NOT_FOUND" });
			}

			return hairSaleUpdated;
		}),
});
