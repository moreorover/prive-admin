import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { cache } from "react";

export const formatAmount = (amount: number) =>
	new Intl.NumberFormat("en-UK", {
		style: "currency",
		currency: "GBP",
	}).format(amount);

export const getSession = cache(async () => {
	return await auth.api.getSession({
		headers: await headers(),
	});
});
