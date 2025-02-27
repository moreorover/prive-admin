import { useState, useCallback, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import dayjs from "dayjs";

function useWeekOffset(initialDate = dayjs()) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const weekOffset = Number(searchParams.get("weekOffset")) || 0;
  const [offset, setOffset] = useState(weekOffset);

  const startOfWeek = dayjs(initialDate)
    .add(offset, "week")
    .startOf("isoWeek")
    .format("YYYY-MM-DD");
  const endOfWeek = dayjs(initialDate)
    .add(offset, "week")
    .endOf("isoWeek")
    .format("YYYY-MM-DD");

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    params.set("weekStart", startOfWeek);
    params.set("weekEnd", endOfWeek);
    params.set("weekOffset", offset.toString());
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [offset, router, searchParams, startOfWeek, endOfWeek]);

  const addWeek = useCallback(() => {
    setOffset((prev) => prev + 1);
  }, []);

  const subtractWeek = useCallback(() => {
    setOffset((prev) => prev - 1);
  }, []);

  const resetWeek = useCallback(() => {
    setOffset(0);
  }, []);

  return { offset, startOfWeek, endOfWeek, addWeek, subtractWeek, resetWeek };
}

export default useWeekOffset;
