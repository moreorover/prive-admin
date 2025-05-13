import "server-only";

import prisma from "@/lib/prisma";

type Transaction = { amount: number };

export function add(a: number, b: number) {
	return a + b;
}

const fetchTransactions = async (start: Date, end: Date) => {
	return prisma.transaction.findMany({
		where: {
			completedDateBy: {
				gte: start,
				lte: end,
			},
			status: "COMPLETED",
			appointmentId: { not: null },
		},
		select: { amount: true },
	});
};

const calculateTimeRange = (start: Date, end: Date) => {
	const rangeDuration = end.getTime() - start.getTime();
	return {
		previousStart: new Date(start.getTime() - rangeDuration),
		previousEnd: start,
	};
};

const calculateMetrics = (transactions: Transaction[]) => {
	const count = transactions.length;
	const sum = transactions.reduce((acc, txn) => acc + txn.amount, 0);
	const average = count > 0 ? sum / count : 0;

	return { count, sum, average };
};

const calculateDifferences = (current: number, previous: number) => {
	const diff = current - previous;
	const percentageDiff =
		previous !== 0 ? (diff / previous) * 100 : current > 0 ? 100 : 0;

	return { previous, diff, percentageDiff };
};

export const calculateTransactionMetrics = async (start: Date, end: Date) => {
	const { previousStart, previousEnd } = calculateTimeRange(start, end);

	const [transactions, previousTransactions] = await Promise.all([
		fetchTransactions(start, end),
		fetchTransactions(previousStart, previousEnd),
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
