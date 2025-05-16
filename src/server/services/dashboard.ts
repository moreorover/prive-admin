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

const fetchHairSoldThroughAppointment = async (start: Dayjs, end: Dayjs) => {
	return prisma.hairAssigned.findMany({
		where: {
			appointment: {
				startsAt: { gte: start.toDate(), lt: end.toDate() },
			},
		},
		select: {
			weightInGrams: true,
			soldFor: true,
			profit: true,
			pricePerGram: true,
		},
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

	return { current, previous, diff, percentageDiff };
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
		total: {
			current: totalSumDiff.current,
			previous: totalSumDiff.previous,
			difference: totalSumDiff.diff,
			percentage: totalSumDiff.percentageDiff,
		},
		average: {
			current: averageAmountDiff.current,
			previous: averageAmountDiff.previous,
			difference: averageAmountDiff.diff,
			percentage: averageAmountDiff.percentageDiff,
		},
		count: {
			current: transactionCountDiff.current,
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
	const rawMetrics = calculateAll(
		transactions.map((t) => t.amount),
		previousTransactions.map((t) => t.amount),
	);

	return {
		total: {
			current: rawMetrics.total.current / 100,
			previous: rawMetrics.total.previous / 100,
			difference: rawMetrics.total.difference / 100,
			percentage: +rawMetrics.total.percentage.toFixed(2),
		},
		average: {
			current: +(rawMetrics.average.current / 100).toFixed(2),
			previous: +(rawMetrics.average.previous / 100).toFixed(2),
			difference: rawMetrics.average.difference / 100,
			percentage: +rawMetrics.average.percentage.toFixed(2),
		},
		count: {
			current: rawMetrics.count.current,
			previous: rawMetrics.count.previous,
			difference: rawMetrics.count.difference,
			percentage: +rawMetrics.count.percentage.toFixed(2),
		},
	};
};

export const calculateHairAssignedMetrics = async (
	currentRange: { start: Dayjs; end: Dayjs },
	previousRange: { start: Dayjs; end: Dayjs },
) => {
	const [hairAssigned, previousHairAssigned] = await Promise.all([
		fetchHairSoldThroughAppointment(currentRange.start, currentRange.end),
		fetchHairSoldThroughAppointment(previousRange.start, previousRange.end),
	]);

	const weightInGrams = calculateAll(
		hairAssigned.map((h) => h.weightInGrams),
		previousHairAssigned.map((h) => h.weightInGrams),
	);

	const soldFor = calculateAll(
		hairAssigned.map((h) => h.soldFor),
		previousHairAssigned.map((h) => h.soldFor),
	);

	const profit = calculateAll(
		hairAssigned.map((h) => h.profit),
		previousHairAssigned.map((h) => h.profit),
	);

	const pricePerGram = calculateAll(
		hairAssigned.map((h) => h.pricePerGram),
		previousHairAssigned.map((h) => h.pricePerGram),
	);

	return {
		weightInGrams: {
			total: {
				current: weightInGrams.total.current,
				previous: weightInGrams.total.previous,
				difference: weightInGrams.total.difference,
				percentage: weightInGrams.total.percentage,
			},
			average: {
				current: +weightInGrams.average.current.toFixed(2),
				previous: weightInGrams.average.previous,
				difference: weightInGrams.average.difference,
				percentage: weightInGrams.average.percentage,
			},
			count: {
				current: weightInGrams.count.current,
				previous: weightInGrams.count.previous,
				difference: weightInGrams.count.difference,
				percentage: weightInGrams.count.percentage,
			},
		},
		soldFor,
		profit,
		pricePerGram,
	};
};
