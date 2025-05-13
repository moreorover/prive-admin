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

export const calculateMetrics = (transactions: Transaction[]) => {
	const count = transactions.length;
	const sum = transactions.reduce((acc, txn) => acc + txn.amount, 0);
	const average = count > 0 ? sum / count : 0;

	return { count, sum, average };
};

export const calculateDifferences = (current: number, previous: number) => {
	const diff = current - previous;
	const percentageDiff =
		previous !== 0 ? (diff / previous) * 100 : current > 0 ? 100 : 0;

	return { previous, diff, percentageDiff };
};

export const calculateTransactionMetrics = async (
	currentRange: { start: Dayjs; end: Dayjs },
	previousRange: { start: Dayjs; end: Dayjs },
) => {
	const [transactions, previousTransactions] = await Promise.all([
		fetchTransactions(currentRange.start, currentRange.end),
		fetchTransactions(previousRange.start, previousRange.end),
	]);

	const currentMetrics = calculateMetrics(transactions);
	const previousMetrics = calculateMetrics(previousTransactions);

	const transactionCountDiff = calculateDifferences(
		currentMetrics.count,
		previousMetrics.count,
	);
	const totalSumDiff = calculateDifferences(
		currentMetrics.sum,
		previousMetrics.sum,
	);
	const averageAmountDiff = calculateDifferences(
		currentMetrics.average,
		previousMetrics.average,
	);

	return {
		totalSum: currentMetrics.sum / 100,
		averageAmount: +(currentMetrics.average / 100).toFixed(2),
		transactionCount: currentMetrics.count,
		totalSumDiff: {
			previous: totalSumDiff.previous / 100,
			diff: totalSumDiff.diff / 100,
			percentage: +totalSumDiff.percentageDiff.toFixed(2),
		},
		averageAmountDiff: {
			previous: averageAmountDiff.previous / 100,
			diff: averageAmountDiff.diff / 100,
			percentage: +averageAmountDiff.percentageDiff.toFixed(2),
		},
		transactionCountDiff: {
			previous: transactionCountDiff.previous / 100,
			diff: transactionCountDiff.diff,
			percentage: +transactionCountDiff.percentageDiff.toFixed(2),
		},
	};
};
