import "server-only";
import prisma from "@/lib/prisma";
import dayjs, { type Dayjs } from "dayjs";

export type Transaction = { amount: number };

const fetchTransactions = async (start: Dayjs, end: Dayjs) => {
	return prisma.transaction.findMany({
		where: {
			completedDateBy: {
				gte: start.toDate(),
				lt: end.toDate(),
			},
			status: "COMPLETED",
			appointmentId: { not: null },
		},
		select: { amount: true },
	});
};

export const calculateMonthlyTimeRange = (date: Dayjs) => {
	const start = date.startOf("month");
	const end = dayjs(start).endOf("month").add(1, "day");

	const previousStart = dayjs(start).subtract(1, "month").startOf("month");
	const previousEnd = dayjs(start)
		.subtract(1, "month")
		.endOf("month")
		.add(1, "day");

	return {
		currentRange: { start, end },
		previousRange: { start: previousStart, end: previousEnd },
	};
};

export const calculateArrayStatistics = (arr: number[]) => {
	const count = arr.length;
	const sum = arr.reduce((acc, a) => acc + a, 0);
	const average = count > 0 ? sum / count : 0;

	return { count, sum, average };
};

export const calculateChange = (current: number, previous: number) => {
	const diff = current - previous;
	const percentageDiff =
		previous !== 0 ? (diff / Math.abs(previous)) * 100 : current > 0 ? 100 : 0;

	return { previous, diff, percentageDiff };
};

export const calculateAll = (current: number[], previous: number[]) => {
	const currentStatistics = calculateArrayStatistics(current);
	const previousStatistics = calculateArrayStatistics(previous);

	const transactionCountDiff = calculateChange(
		currentStatistics.count,
		previousStatistics.count,
	);
	const totalSumDiff = calculateChange(
		currentStatistics.sum,
		previousStatistics.sum,
	);
	const averageAmountDiff = calculateChange(
		currentStatistics.average,
		previousStatistics.average,
	);

	return {
		total: currentStatistics.sum / 100,
		average: +(currentStatistics.average / 100).toFixed(2),
		count: currentStatistics.count,
		totalChange: {
			previous: totalSumDiff.previous / 100,
			difference: totalSumDiff.diff / 100,
			percentage: +totalSumDiff.percentageDiff.toFixed(2),
		},
		averageChange: {
			previous: averageAmountDiff.previous / 100,
			difference: averageAmountDiff.diff / 100,
			percentage: +averageAmountDiff.percentageDiff.toFixed(2),
		},
		countChange: {
			previous: transactionCountDiff.previous,
			difference: transactionCountDiff.diff,
			percentage: +transactionCountDiff.percentageDiff.toFixed(2),
		},
	};
};

export const calculateTransactionMetrics = async (
	currentRange: { start: Dayjs; end: Dayjs },
	previousRange: { start: Dayjs; end: Dayjs },
) => {
	const [transactions, previousTransactions] = await Promise.all([
		fetchTransactions(currentRange.start, currentRange.end),
		fetchTransactions(previousRange.start, previousRange.end),
	]);

	return calculateAll(
		transactions.map((t) => t.amount),
		previousTransactions.map((t) => t.amount),
	);
};
