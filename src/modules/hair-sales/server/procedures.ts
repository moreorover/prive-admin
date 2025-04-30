import prisma from "@/lib/prisma";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { z } from "zod";

export const hairSalesRouter = createTRPCRouter({
	getAll: protectedProcedure.query(() => {
		return prisma.hairSale.findMany({
			include: { createdBy: true, customer: true },
			orderBy: { placedAt: "desc" },
		});
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
});
