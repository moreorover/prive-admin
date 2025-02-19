"use client";

import { useCSVReader } from "react-papaparse";
import { IconUpload } from "@tabler/icons-react";
import { Button } from "@mantine/core";
import React from "react";

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
          <IconUpload className="size-4 mr-2" />
          {text} Import
        </Button>
      )}
    </CSVReader>
  );
};
