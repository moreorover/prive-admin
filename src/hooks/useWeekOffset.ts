import { useState, useCallback, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import dayjs from "dayjs";

function useWeekOffset(initialDate = dayjs()) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const weekStartParam = searchParams.get("weekStart");
  const weekStart = weekStartParam
    ? dayjs(weekStartParam)
    : dayjs(initialDate).startOf("isoWeek");

  const [currentWeekStart, setCurrentWeekStart] = useState(weekStart);
  const currentWeekEnd = currentWeekStart.endOf("isoWeek");

  // Prevent infinite loops
  useEffect(() => {
    const currentParams = new URLSearchParams(searchParams);
    const existingWeekStart = currentParams.get("weekStart");
    const existingWeekEnd = currentParams.get("weekEnd");

    const newWeekStart = currentWeekStart.format("YYYY-MM-DD");
    const newWeekEnd = currentWeekEnd.format("YYYY-MM-DD");

    if (existingWeekStart !== newWeekStart || existingWeekEnd !== newWeekEnd) {
      currentParams.set("weekStart", newWeekStart);
      currentParams.set("weekEnd", newWeekEnd);
      router.replace(`?${currentParams.toString()}`, { scroll: false });
    }
  }, [currentWeekStart, currentWeekEnd, router, searchParams]);

  const addWeek = useCallback(() => {
    setCurrentWeekStart((prev) => prev.add(1, "week"));
  }, []);

  const subtractWeek = useCallback(() => {
    setCurrentWeekStart((prev) => prev.subtract(1, "week"));
  }, []);

  const resetWeek = useCallback(() => {
    setCurrentWeekStart(dayjs().startOf("isoWeek"));
  }, []);

  return {
    isCurrentWeek: currentWeekStart.isSame(dayjs().startOf("isoWeek"), "day"),
    startOfWeek: currentWeekStart.format("YYYY-MM-DD"),
    endOfWeek: currentWeekEnd.format("YYYY-MM-DD"),
    addWeek,
    subtractWeek,
    resetWeek,
  };
}

export default useWeekOffset;
