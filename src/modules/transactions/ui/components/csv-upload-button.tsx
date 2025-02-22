"use client";

import { useCSVReader } from "react-papaparse";
import { Button } from "@mantine/core";
import React from "react";
import { Upload } from "lucide-react";

const INITIAL_IMPORT_RESULTS = {
  data: [],
  errors: [],
  meta: {},
};

type Props = {
  text: string;
  onUploadAction: (results: typeof INITIAL_IMPORT_RESULTS) => void;
};

export const CsvUploadButton = ({ text, onUploadAction }: Props) => {
  const { CSVReader } = useCSVReader();

  return (
    <CSVReader onUploadAccepted={onUploadAction}>
      {({
        getRootProps,
      }: {
        getRootProps: () => React.ButtonHTMLAttributes<HTMLButtonElement>;
      }) => (
        <Button size="sm" className="w-full lg:w-auto" {...getRootProps()}>
          <Upload />
          {text} Import
        </Button>
      )}
    </CSVReader>
  );
};
