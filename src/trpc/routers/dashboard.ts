import { calculateTransactionMetrics } from "@/server/dashboard";
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { z } from "zod";

export const dashboardRouter = createTRPCRouter({
	getTransactionStats: protectedProcedure
		.input(z.object({ start: z.date(), end: z.date() }))
		.query(async ({ input }) => {
			const { start, end } = input;

			if (!start || !end) {
				throw new Error("Missing start or end");
			}

			return await calculateTransactionMetrics(start, end);
		}),
});
