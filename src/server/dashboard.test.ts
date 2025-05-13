import dayjs from "dayjs";
import { expect, test, vi } from "vitest";
import {
	type Transaction,
	calculateDifferences,
	calculateMetrics,
	calculateMonthlyTimeRange,
} from "./dashboard";

// Disables a package that checks that code is only executed on the server side.
// Also, this mock can be defined in the Vitest setup file.
vi.mock("server-only", () => {
	return {};
});

test("Test function to calculate date range", () => {
	const date = dayjs("2025-03-15");

	const range = calculateMonthlyTimeRange(date);

	expect(range.currentRange.start.toISOString()).toBe(
		"2025-03-01T00:00:00.000Z",
	);

	expect(range.currentRange.end.toISOString()).toBe("2025-04-01T22:59:59.999Z");

	expect(range.previousRange.start.toISOString()).toBe(
		"2025-02-01T00:00:00.000Z",
	);

	expect(range.previousRange.end.toISOString()).toBe(
		"2025-03-01T23:59:59.999Z",
	);
});

test("Test function to calculate transaction metrics", () => {
	const transactions: Transaction[] = [
		{ amount: 500 },
		{ amount: 1000 },
		{ amount: 1500 },
	];

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
