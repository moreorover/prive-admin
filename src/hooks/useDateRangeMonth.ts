import { useState, useCallback, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import dayjs from "dayjs";

function useDateRangeMonth() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const monthStartParam = searchParams.get("monthStart");
  const monthStart = monthStartParam
    ? dayjs(monthStartParam)
    : dayjs().startOf("month");

  const [currentMonthStart, setCurrentMonthStart] = useState(monthStart);
  const [currentMonthEnd, setCurrentMonthEnd] = useState(
    monthStart.endOf("month"),
  );

  const [pendingDates, setPendingDates] = useState<[Date | null, Date | null]>([
    currentMonthStart.toDate(),
    currentMonthEnd.toDate(),
  ]);

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

  const setStartAndEnd = useCallback((dates: [Date | null, Date | null]) => {
    setPendingDates(dates);
  }, []);

  const confirmDateSelection = () => {
    if (pendingDates[0] && pendingDates[1]) {
      setCurrentMonthStart(dayjs(pendingDates[0]).startOf("day"));
      setCurrentMonthEnd(dayjs(pendingDates[1]).endOf("day"));
    }
  };

  // Function to determine if confirmation is pending
  const isConfirmationPending = () => {
    if (!pendingDates[0] || !pendingDates[1]) return false; // No selection made yet

    const pendingStart = dayjs(pendingDates[0]).startOf("day");
    const pendingEnd = dayjs(pendingDates[1]).endOf("day");

    return (
      !pendingStart.isSame(currentMonthStart, "day") ||
      !pendingEnd.isSame(currentMonthEnd, "day")
    );
  };

  return {
    startOfMonth: currentMonthStart.format("YYYY-MM-DD"),
    endOfMonth: currentMonthEnd.format("YYYY-MM-DD"),
    pendingDates,
    setStartAndEnd,
    confirmDateSelection,
    isConfirmationPending,
  };
}

export default useDateRangeMonth;
