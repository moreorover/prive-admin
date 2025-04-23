export const formatAmount = (amount: number) =>
	new Intl.NumberFormat("en-UK", {
		style: "currency",
		currency: "GBP",
	}).format(amount);
