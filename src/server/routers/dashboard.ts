import {
	calculateMonthlyTimeRange,
	calculateTransactionMetrics,
} from "@/server/services/dashboard";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";
import dayjs from "dayjs";
import { z } from "zod";

export const dashboardRouter = createTRPCRouter({
	getTransactionStatsForDate: protectedProcedure
		.input(z.object({ date: z.date() }))
		.query(async ({ input }) => {
			const { date } = input;

			if (!date) {
				throw new Error("Missing date");
			}

			const { currentRange, previousRange } = calculateMonthlyTimeRange(
				dayjs(date),
			);

			return await calculateTransactionMetrics(currentRange, previousRange);
		}),
});
