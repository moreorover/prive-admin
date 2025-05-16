import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { expect, test, vi } from "vitest";
import {
	calculateArrayStatistics,
	calculateChange,
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

	const { count, sum, average } = calculateArrayStatistics(transactions);

	expect(count).toBe(3);
	expect(sum).toBe(3000);
	expect(average).toBe(1000);
});

test("Test function to calculate transaction metrics", () => {
	const transactions: number[] = [333, 1001, 1538];

	const { count, sum, average } = calculateArrayStatistics(transactions);

	expect(count).toBe(3);
	expect(sum).toBe(2872);
	expect(average).toBe(957.33);
});

test("Test function to calculate difference", () => {
	const { previous, percentage, difference } = calculateChange(1000, 2000);

	expect(previous).toBe(2000);
	expect(percentage).toBe(-50);
	expect(difference).toBe(-1000);
});

test("Test function to calculate negative difference", () => {
	const { previous, percentage, difference } = calculateChange(5, -5);

	expect(previous).toBe(-5);
	expect(percentage).toBe(200);
	expect(difference).toBe(10);
});

test("Test function to calculate negative difference", () => {
	const { previous, percentage, difference } = calculateChange(13, 7);

	expect(previous).toBe(7);
	expect(percentage).toBe(85.71);
	expect(difference).toBe(6);
});

test("Test function to calculate negative difference", () => {
	const { previous, percentage, difference } = calculateChange(-5, 5);

	expect(previous).toBe(5);
	expect(percentage).toBe(-200);
	expect(difference).toBe(-10);
});

test("Test function to calculate negative difference", () => {
	const { previous, percentage, difference } = calculateChange(-5, 0);

	expect(previous).toBe(0);
	expect(percentage).toBe(0);
	expect(difference).toBe(-5);
});

test("Test function to calculate negative difference", () => {
	const { previous, percentage, difference } = calculateChange(0, -5);

	expect(previous).toBe(-5);
	expect(percentage).toBe(100);
	expect(difference).toBe(5);
});

test("Test function to calculate negative difference", () => {
	const { previous, percentage, difference } = calculateChange(-10, -5);

	expect(previous).toBe(-5);
	expect(percentage).toBe(-100);
	expect(difference).toBe(-5);
});

test("Test function to calculate negative difference", () => {
	const { previous, percentage, difference } = calculateChange(-5, -10);

	expect(previous).toBe(-10);
	expect(percentage).toBe(50);
	expect(difference).toBe(5);
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

	expect(metrics.total.current).toBe(30);
	expect(metrics.total.previous).toBe(11);
	expect(metrics.total.difference).toBe(19);
	expect(metrics.total.percentage).toBe(172.73);

	expect(metrics.average.current).toBe(10);
	expect(metrics.average.previous).toBe(5.5);
	expect(metrics.average.difference).toBe(4.5);
	expect(metrics.average.percentage).toBe(81.82);

	expect(metrics.count.current).toBe(3);
	expect(metrics.count.previous).toBe(2);
	expect(metrics.count.difference).toBe(1);
	expect(metrics.count.percentage).toBe(50);
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

	expect(metrics.total.current).toBe(-1000);
	expect(metrics.total.previous).toBe(-500);
	expect(metrics.total.difference).toBe(-500);
	expect(metrics.total.percentage).toBe(-100);

	expect(metrics.average.current).toBe(-1000);
	expect(metrics.average.previous).toBe(-500);
	expect(metrics.average.difference).toBe(-500);
	expect(metrics.average.percentage).toBe(-100);

	expect(metrics.count.current).toBe(1);
	expect(metrics.count.previous).toBe(1);
	expect(metrics.count.difference).toBe(0);
	expect(metrics.count.percentage).toBe(0);
});
