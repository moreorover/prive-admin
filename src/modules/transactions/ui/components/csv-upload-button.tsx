"use client";

import { useSmartCsvParser } from "@/modules/transactions/hooks/useSmartCsvParser";
import { Button, Group } from "@mantine/core";
import { Upload } from "lucide-react";
import type React from "react";
import { useCSVReader } from "react-papaparse";

export const CsvUploadButton = () => {
	const { CSVReader } = useCSVReader();
	const parseCsvData = useSmartCsvParser();

	return (
		<CSVReader onUploadAccepted={parseCsvData}>
			{({
				getRootProps,
			}: {
				getRootProps: () => React.ButtonHTMLAttributes<HTMLButtonElement>;
			}) => (
				<Button size="sm" className="w-full lg:w-auto" {...getRootProps()}>
					<Group>
						<Upload />
						Import CSV
					</Group>
				</Button>
			)}
		</CSVReader>
	);
};
