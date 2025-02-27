import { useState, useCallback, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import dayjs from "dayjs";

function useMonthOffset(initialDate = dayjs()) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const monthStartParam = searchParams.get("monthStart");
  const monthStart = monthStartParam
    ? dayjs(monthStartParam)
    : dayjs(initialDate).startOf("month");

  const [currentMonthStart, setCurrentMonthStart] = useState(monthStart);
  const currentMonthEnd = currentMonthStart.endOf("month");

  const isCurrentMonth = currentMonthStart.isSame(
    dayjs().startOf("month"),
    "month",
  );

  useEffect(() => {
    const currentParams = new URLSearchParams(searchParams);
    const existingMonthStart = currentParams.get("monthStart");
    const existingMonthEnd = currentParams.get("monthEnd");

    const newMonthStart = currentMonthStart.format("YYYY-MM-DD");
    const newMonthEnd = currentMonthEnd.format("YYYY-MM-DD");

    if (
      existingMonthStart !== newMonthStart ||
      existingMonthEnd !== newMonthEnd
    ) {
      currentParams.set("monthStart", newMonthStart);
      currentParams.set("monthEnd", newMonthEnd);
      router.replace(`?${currentParams.toString()}`, { scroll: false });
    }
  }, [currentMonthStart, currentMonthEnd, router, searchParams]);

  const addMonth = useCallback(() => {
    setCurrentMonthStart((prev) => prev.add(1, "month"));
  }, []);

  const subtractMonth = useCallback(() => {
    setCurrentMonthStart((prev) => prev.subtract(1, "month"));
  }, []);

  const resetMonth = useCallback(() => {
    setCurrentMonthStart(dayjs().startOf("month"));
  }, []);

  return {
    isCurrentMonth,
    startOfMonth: currentMonthStart.format("YYYY-MM-DD"),
    endOfMonth: currentMonthEnd.format("YYYY-MM-DD"),
    addMonth,
    subtractMonth,
    resetMonth,
  };
}

export default useMonthOffset;
