import prisma from "@/lib/prisma";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";

export const hairSalesRouter = createTRPCRouter({
	getAll: protectedProcedure.query(() => {
		return prisma.hairSale.findMany({
			include: { createdBy: true, customer: true },
		});
	}),
});
