import { readFileSync } from "fs";

const { tables } = JSON.parse(
	readFileSync("./prisma/scripts/backup/backup_2025-04-21.json", "utf-8"),
);

const totals = tables["hairOrders"].map((order) => {
	const totalWeight = tables["hair"]
		.filter((h) => h.hairOrderId === order.id)
		.reduce((sum, h) => sum + (h.weightReceived || 0), 0);

	return {
		hairOrderId: order.id,
		totalWeightReceived: totalWeight,
	};
});

console.log(totals);
