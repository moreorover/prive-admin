import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { expect, test, vi } from "vitest";
import {
	calculateDifferences,
	calculateMetrics,
	calculateMonthlyTimeRange,
	calculateTransactionMetrics,
} from "./dashboard";

// Ensure UTC plugin is applied
dayjs.extend(utc);

// Disables a package that checks that code is only executed on the server side.
// Also, this mock can be defined in the Vitest setup file.
vi.mock("server-only", () => {
	return {};
});

const mockFetchTransactions = vi.fn();

vi.mock("@/lib/prisma", async () => {
	const originalModule = await vi.importActual<
		typeof import("@/lib/__mocks__/prisma")
	>("@/lib/__mocks__/prisma");
	return {
		...originalModule,
		default: {
			transaction: {
				findMany: (...args: unknown[]) => mockFetchTransactions(...args),
			},
		},
	};
});

test("Test function to calculate date range", () => {
	const date = dayjs.utc("2025-03-15");

	const range = calculateMonthlyTimeRange(date);

	expect(range.currentRange.start.toISOString()).toBe(
		"2025-03-01T00:00:00.000Z",
	);

	expect(range.currentRange.end.toISOString()).toBe("2025-04-01T23:59:59.999Z");

	expect(range.previousRange.start.toISOString()).toBe(
		"2025-02-01T00:00:00.000Z",
	);

	expect(range.previousRange.end.toISOString()).toBe(
		"2025-03-01T23:59:59.999Z",
	);
});

test("Test function to calculate transaction metrics", () => {
	const transactions: number[] = [500, 1000, 1500];

	const { count, sum, average } = calculateMetrics(transactions);

	expect(count).toBe(3);
	expect(sum).toBe(3000);
	expect(average).toBe(1000);
});

test("Test function to calculate difference", () => {
	const { previous, percentageDiff, diff } = calculateDifferences(1000, 2000);

	expect(previous).toBe(2000);
	expect(percentageDiff).toBe(-50);
	expect(diff).toBe(-1000);
});

test("Test function to calculate negative difference", () => {
	const { previous, percentageDiff, diff } = calculateDifferences(5, -5);

	expect(previous).toBe(-5);
	expect(percentageDiff).toBe(200);
	expect(diff).toBe(10);
});

test("Test function to calculate negative difference", () => {
	const { previous, percentageDiff, diff } = calculateDifferences(-5, 5);

	expect(previous).toBe(5);
	expect(percentageDiff).toBe(-200);
	expect(diff).toBe(-10);
});

test("Test function to calculate negative difference", () => {
	const { previous, percentageDiff, diff } = calculateDifferences(-5, 0);

	expect(previous).toBe(0);
	expect(percentageDiff).toBe(0);
	expect(diff).toBe(-5);
});

test("Test function to calculate negative difference", () => {
	const { previous, percentageDiff, diff } = calculateDifferences(0, -5);

	expect(previous).toBe(-5);
	expect(percentageDiff).toBe(100);
	expect(diff).toBe(5);
});

test("Test function to calculate negative difference", () => {
	const { previous, percentageDiff, diff } = calculateDifferences(-10, -5);

	expect(previous).toBe(-5);
	expect(percentageDiff).toBe(-100);
	expect(diff).toBe(-5);
});

test("Test function to calculate negative difference", () => {
	const { previous, percentageDiff, diff } = calculateDifferences(-5, -10);

	expect(previous).toBe(-10);
	expect(percentageDiff).toBe(50);
	expect(diff).toBe(5);
});

test("calculateTransactionMetrics - calculates metrics correctly", async () => {
	const date = dayjs("2025-03-15");
	const { currentRange, previousRange } = calculateMonthlyTimeRange(date);

	mockFetchTransactions.mockResolvedValueOnce([
		{ amount: 500 },
		{ amount: 1000 },
		{ amount: 1500 },
	]);
	mockFetchTransactions.mockResolvedValueOnce([
		{ amount: 300 },
		{ amount: 800 },
	]);

	const metrics = await calculateTransactionMetrics(
		currentRange,
		previousRange,
	);

	expect(metrics.totalSum).toBe(30);
	expect(metrics.averageAmount).toBe(10);
	expect(metrics.transactionCount).toBe(3);

	expect(metrics.totalSumDiff.previous).toBe(11);
	expect(metrics.totalSumDiff.diff).toBe(19);
	expect(metrics.totalSumDiff.percentage).toBeCloseTo(172.73);

	expect(metrics.averageAmountDiff.previous).toBe(5.5);
	expect(metrics.averageAmountDiff.diff).toBe(4.5);
	expect(metrics.averageAmountDiff.percentage).toBeCloseTo(81.82);

	expect(metrics.transactionCountDiff.previous).toBe(2);
	expect(metrics.transactionCountDiff.diff).toBe(1);
	expect(metrics.transactionCountDiff.percentage).toBeCloseTo(50);
});

test("fetchTransactions - fetches transactions within the given current date range", async () => {
	const date = dayjs("2025-03-15");
	const { currentRange } = calculateMonthlyTimeRange(date);

	mockFetchTransactions.mockResolvedValueOnce([
		{ amount: 300 },
		{ amount: 700 },
	]);

	const transactions = await mockFetchTransactions(
		currentRange.start,
		currentRange.end,
	);

	expect(transactions).toEqual([{ amount: 300 }, { amount: 700 }]);
	expect(mockFetchTransactions).toHaveBeenCalledWith({
		where: {
			completedDateBy: {
				gte: currentRange.start.toDate(),
				lt: currentRange.end.toDate(),
			},
			status: "COMPLETED",
			appointmentId: { not: null },
		},
		select: { amount: true },
	});
});

test("fetchTransactions - fetches transactions within the given previous date range", async () => {
	const date = dayjs("2025-03-15");
	const { previousRange } = calculateMonthlyTimeRange(date);

	mockFetchTransactions.mockResolvedValueOnce([
		{ amount: 300 },
		{ amount: 700 },
	]);

	const transactions = await mockFetchTransactions(
		previousRange.start,
		previousRange.end,
	);

	expect(transactions).toEqual([{ amount: 300 }, { amount: 700 }]);
	expect(mockFetchTransactions).toHaveBeenCalledWith({
		where: {
			completedDateBy: {
				gte: previousRange.start.toDate(),
				lt: previousRange.end.toDate(),
			},
			status: "COMPLETED",
			appointmentId: { not: null },
		},
		select: { amount: true },
	});
});

test("calculateTransactionMetrics - calculates negative metrics correctly", async () => {
	const date = dayjs("2025-03-15");
	const { currentRange, previousRange } = calculateMonthlyTimeRange(date);

	mockFetchTransactions.mockResolvedValueOnce([{ amount: -100000 }]);
	mockFetchTransactions.mockResolvedValueOnce([{ amount: -50000 }]);

	const metrics = await calculateTransactionMetrics(
		currentRange,
		previousRange,
	);

	expect(metrics.totalSum).toBe(-1000);
	expect(metrics.averageAmount).toBe(-1000);
	expect(metrics.transactionCount).toBe(1);

	expect(metrics.totalSumDiff.previous).toBe(-500);
	expect(metrics.totalSumDiff.diff).toBe(-500);
	expect(metrics.totalSumDiff.percentage).toBe(-100);

	expect(metrics.averageAmountDiff.previous).toBe(-500);
	expect(metrics.averageAmountDiff.diff).toBe(-500);
	expect(metrics.averageAmountDiff.percentage).toBe(-100);

	expect(metrics.transactionCountDiff.previous).toBe(1);
	expect(metrics.transactionCountDiff.diff).toBe(0);
	expect(metrics.transactionCountDiff.percentage).toBe(0);
});
