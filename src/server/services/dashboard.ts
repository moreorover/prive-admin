import "server-only";
import { formatAmount } from "@/lib/helpers";
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

const fetchHairSoldThroughSale = async (start: Dayjs, end: Dayjs) => {
	return prisma.hairAssigned.findMany({
		where: {
			appointmentId: null,
			createdAt: { gte: start.toDate(), lt: end.toDate() },
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

	return { count, sum, average: +average.toFixed(2) };
};

export const calculateChange = (current: number, previous: number) => {
	const difference = current - previous;
	const percentage =
		previous !== 0
			? (difference / Math.abs(previous)) * 100
			: current > 0
				? 100
				: 0;

	return {
		current,
		previous,
		difference,
		percentage: +percentage.toFixed(2),
	};
};

export const calculateAll = (current: number[], previous: number[]) => {
	const currentStatistics = calculateArrayStatistics(current);
	const previousStatistics = calculateArrayStatistics(previous);

	const count = calculateChange(
		currentStatistics.count,
		previousStatistics.count,
	);
	const total = calculateChange(currentStatistics.sum, previousStatistics.sum);
	const average = calculateChange(
		currentStatistics.average,
		previousStatistics.average,
	);

	return {
		total,
		average,
		count,
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
			current: formatAmount(rawMetrics.total.current / 100),
			previous: formatAmount(rawMetrics.total.previous / 100),
			difference: formatAmount(rawMetrics.total.difference / 100),
			percentage: rawMetrics.total.percentage,
		},
		average: {
			current: formatAmount(rawMetrics.average.current / 100),
			previous: formatAmount(rawMetrics.average.previous / 100),
			difference: formatAmount(rawMetrics.average.difference / 100),
			percentage: rawMetrics.average.percentage,
		},
		count: {
			current: rawMetrics.count.current,
			previous: rawMetrics.count.previous,
			difference: rawMetrics.count.difference,
			percentage: rawMetrics.count.percentage,
		},
	};
};

export const mapHairAssigned = (
	weightInGrams,
	soldFor,
	profit,
	pricePerGram,
) => {
	return {
		weightInGrams: {
			total: {
				current: `${weightInGrams.total.current}g`,
				previous: `${weightInGrams.total.previous}g`,
				difference: `${weightInGrams.total.difference}g`,
				percentage: weightInGrams.total.percentage,
			},
			average: {
				current: `${weightInGrams.average.current.toFixed(1)}g`,
				previous: `${weightInGrams.average.previous.toFixed(1)}g`,
				difference: `${weightInGrams.average.difference.toFixed(1)}g`,
				percentage: weightInGrams.average.percentage,
			},
			count: {
				current: weightInGrams.count.current,
				previous: weightInGrams.count.previous,
				difference: weightInGrams.count.difference,
				percentage: weightInGrams.count.percentage,
			},
		},
		soldFor: {
			total: {
				current: formatAmount(soldFor.total.current / 100),
				previous: formatAmount(soldFor.total.previous / 100),
				difference: formatAmount(soldFor.total.difference / 100),
				percentage: soldFor.total.percentage,
			},
			average: {
				current: formatAmount(soldFor.average.current / 100),
				previous: formatAmount(soldFor.average.previous / 100),
				difference: formatAmount(soldFor.average.difference / 100),
				percentage: soldFor.average.percentage,
			},
			count: {
				current: soldFor.count.current,
				previous: soldFor.count.previous,
				difference: soldFor.count.difference,
				percentage: soldFor.count.percentage,
			},
		},
		profit: {
			total: {
				current: formatAmount(profit.total.current / 100),
				previous: formatAmount(profit.total.previous / 100),
				difference: formatAmount(profit.total.difference / 100),
				percentage: profit.total.percentage,
			},
			average: {
				current: formatAmount(profit.average.current / 100),
				previous: formatAmount(profit.average.previous / 100),
				difference: formatAmount(profit.average.difference / 100),
				percentage: profit.average.percentage,
			},
			count: {
				current: profit.count.current,
				previous: profit.count.previous,
				difference: profit.count.difference,
				percentage: profit.count.percentage,
			},
		},
		pricePerGram: {
			total: {
				current: 0,
				previous: 0,
				difference: 0,
				percentage: 0,
			},
			average: {
				current: formatAmount(pricePerGram.average.current / 100),
				previous: formatAmount(pricePerGram.average.previous / 100),
				difference: formatAmount(pricePerGram.average.difference / 100),
				percentage: pricePerGram.average.percentage,
			},
			count: {
				current: pricePerGram.count.current,
				previous: pricePerGram.count.previous,
				difference: pricePerGram.count.difference,
				percentage: pricePerGram.count.percentage,
			},
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

	return mapHairAssigned(weightInGrams, soldFor, profit, pricePerGram);
};

export const calculateHairSoldMetrics = async (
	currentRange: { start: Dayjs; end: Dayjs },
	previousRange: { start: Dayjs; end: Dayjs },
) => {
	const [hairAssigned, previousHairAssigned] = await Promise.all([
		fetchHairSoldThroughSale(currentRange.start, currentRange.end),
		fetchHairSoldThroughSale(previousRange.start, previousRange.end),
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

	return mapHairAssigned(weightInGrams, soldFor, profit, pricePerGram);
};
