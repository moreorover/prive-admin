"use client";

import { useCSVReader } from "react-papaparse";
import { Button, Group } from "@mantine/core";
import React from "react";
import { Upload } from "lucide-react";
import { useSmartCsvParser } from "@/modules/transactions/hooks/useSmartCsvParser";

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
