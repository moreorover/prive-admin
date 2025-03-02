import { useState, useCallback, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import dayjs from "dayjs";

function useDateRange() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const startParam = searchParams.get("start");
  const endParam = searchParams.get("end");
  const start =
    startParam && endParam ? dayjs(startParam) : dayjs().startOf("week");
  const end = startParam && endParam ? dayjs(endParam) : dayjs().endOf("week");

  const [currentStart, setCurrentStart] = useState(start);
  const [currentEnd, setCurrentEnd] = useState(end);

  useEffect(() => {
    const currentParams = new URLSearchParams(searchParams);
    const existingStart = currentParams.get("start");
    const existingEnd = currentParams.get("end");

    const newStart = currentStart.format("YYYY-MM-DD");
    const newEnd = currentEnd.format("YYYY-MM-DD");

    if (existingStart !== newStart || existingEnd !== newEnd) {
      currentParams.set("start", newStart);
      currentParams.set("end", newEnd);
      router.replace(`?${currentParams.toString()}`, { scroll: false });
    }
  }, [currentStart, currentEnd, router, searchParams]);

  const setStartAndEnd = useCallback(
    (dateRange: { start: Date; end: Date }) => {
      const { start, end } = dateRange;
      setCurrentStart(
        start ? dayjs(start).startOf("day") : dayjs().startOf("week"),
      );
      setCurrentEnd(end ? dayjs(end).endOf("day") : dayjs().endOf("week"));
    },
    [],
  );

  return {
    start: currentStart.format("YYYY-MM-DD"),
    end: currentEnd.format("YYYY-MM-DD"),
    startAsDate: currentStart.toDate(),
    endAsDate: currentEnd.toDate(),
    rangeText: currentStart.isSame(currentEnd, "year")
      ? `${currentStart.format("MMM D")} — ${currentEnd.format("MMM D, YYYY")}` // Same year, keep the end date's year
      : `${currentStart.format("MMM D, YYYY")} — ${currentEnd.format("MMM D, YYYY")}`, // Different years, show both
    setStartAndEnd,
  };
}

export default useDateRange;
