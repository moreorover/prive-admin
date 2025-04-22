import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

function useCounter(initialValue = 0, paramName = "offset") {
	const searchParams = useSearchParams();
	const router = useRouter();
	const offset = Number(searchParams.get(paramName)) || initialValue;
	const [count, setCount] = useState(offset);

	useEffect(() => {
		const params = new URLSearchParams(searchParams);
		params.set(paramName, count.toString());
		router.replace(`?${params.toString()}`, { scroll: false });
	}, [count, paramName, router, searchParams]);

	const increase = useCallback(() => {
		setCount((prev) => prev + 1);
	}, []);

	const decrease = useCallback(() => {
		setCount((prev) => prev - 1);
	}, []);

	const reset = useCallback(() => {
		setCount(0);
	}, []);

	return { count, increase, decrease, reset };
}

export default useCounter;
