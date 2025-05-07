import dayjs from "dayjs";
import { useSearchParams } from "next/navigation";
import { useCallback } from "react";

function useDateRange(): {
	start: string;
	end: string;
	range: [string, string];
	rangeText: string;
	createQueryString: (range: [string, string]) => string;
} {
	const searchParams = useSearchParams();
	const startParam = searchParams.get("start");
	const endParam = searchParams.get("end");
	const start =
		startParam && endParam ? dayjs(startParam) : dayjs().startOf("week");
	const end = startParam && endParam ? dayjs(endParam) : dayjs().endOf("week");

	const createQueryString = useCallback(
		(range: [string, string]) => {
			const [start, end] = range;
			const params = new URLSearchParams(searchParams.toString());
			params.set("start", dayjs(start).format("YYYY-MM-DD"));
			params.set("end", dayjs(end).format("YYYY-MM-DD"));

			return `?${params.toString()}`;
		},
		[searchParams],
	);

	return {
		start: start.format("YYYY-MM-DD"),
		end: end.format("YYYY-MM-DD"),
		range: [
			start.format("YYYY-MM-DD").toString(),
			end.format("YYYY-MM-DD").toString(),
		],
		rangeText: start.isSame(end, "year")
			? `${start.format("MMM D")} — ${end.format("MMM D, YYYY")}` // Same year, keep the end date's year
			: `${start.format("MMM D, YYYY")} — ${end.format("MMM D, YYYY")}`, // Different years, show both
		createQueryString,
	};
}

export default useDateRange;
