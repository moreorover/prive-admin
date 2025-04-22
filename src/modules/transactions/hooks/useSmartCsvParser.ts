import type { MonzoTransaction } from "@/modules/transactions/hooks/monzoCsvConfig";
import type { PayPalTransaction } from "@/modules/transactions/hooks/paypalCsvConfig";
// useSmartCsvParser.ts
import { notifications } from "@mantine/notifications";
import { areArraysIdentical } from "./csvUtils";
import {
	type CsvParserConfig,
	knownConfigs,
	parseAndTransformTransactions,
} from "./knownConfigs";

interface CSVUploadResults {
	data: string[][];
	errors: string[];
	meta: unknown;
}

export function useSmartCsvParser() {
	// const utils = trpc.useUtils();
	// const createTransactions = trpc.transactions.createTransactions.useMutation({
	//   onSuccess: (result) => {
	//     if (result.count === 0) {
	//       notifications.show({
	//         color: "yellow",
	//         title: "Attention!",
	//         message: "No transactions have been imported!",
	//       });
	//       return;
	//     }
	//     utils.transactions.getAll.invalidate();
	//     notifications.show({
	//       color: "green",
	//       title: "Success!",
	//       message: `Total of ${result.count} Transactions created!`,
	//     });
	//   },
	//   onError: () => {
	//     notifications.show({
	//       color: "red",
	//       title: "Failed to create Transactions",
	//       message: "Please try again.",
	//     });
	//   },
	// });

	const parseCsvData = async (results: CSVUploadResults): Promise<void> => {
		if (results.errors.length > 0) {
			notifications.show({
				color: "red",
				title: "Error parsing CSV file.",
				message: "Please try again.",
			});
			return;
		}

		const allRows = results.data;
		if (!allRows || allRows.length === 0) {
			notifications.show({
				color: "red",
				title: "No data found in the CSV file.",
				message: "Please try again.",
			});
			return;
		}

		const headerRow = allRows[0];

		const config = knownConfigs.find((cfg) =>
			areArraysIdentical(cfg.expectedHeaders, headerRow),
		) as CsvParserConfig<MonzoTransaction | PayPalTransaction> | undefined;

		if (!config) {
			notifications.show({
				color: "red",
				title: "Unrecognized CSV format.",
				message: "The CSV file does not match any known format.",
			});
			return;
		}

		const dataRows = allRows
			.slice(1)
			.filter((row) => row.some((cell) => cell.trim() !== ""));

		const transactions = parseAndTransformTransactions<
			typeof config extends CsvParserConfig<infer U> ? U : never
		>(config, dataRows, headerRow);

		if (transactions.length === 0) {
			notifications.show({
				color: "yellow",
				title: "No transactions found",
				message: "No valid transactions were extracted from the CSV file.",
			});
			return;
		}

		// createTransactions.mutate({ transactions });
	};

	return parseCsvData;
}
