"use client";

import React from "react";
import { Transaction } from "@/lib/schemas";
import { notifications } from "@mantine/notifications";
import { CsvUploadButton } from "@/modules/transactions/ui/components/csv-upload-button";
import { trpc } from "@/trpc/client"; // adjust the import path as needed

// Define the type for CSV upload results.
interface CSVUploadResults {
  data: string[][];
  errors: string[];
  meta: unknown;
}

// Define the shape of a Monzo transaction.
export interface MonzoTransaction {
  transactionId: string;
  date: string;
  time: string;
  type: string;
  name: string;
  emoji: string;
  category: string;
  amount: number;
  currency: string;
  localAmount: number;
  localCurrency: string;
  notesAndTags: string;
  address: string;
  receipt: string;
  description: string;
  categorySplit: string;
  moneyOut: number;
  moneyIn: number;
  balance: number;
  balanceCurrency: string;
}

// Define the keys that should be parsed as numbers.
type NumericKey = "amount" | "localAmount" | "moneyOut" | "moneyIn" | "balance";

// Type guard to determine if a key is a NumericKey.
function isNumericKey(key: keyof MonzoTransaction): key is NumericKey {
  return ["amount", "localAmount", "moneyOut", "moneyIn", "balance"].includes(
    key,
  );
}

const expectedHeaders = [
  "Transaction ID",
  "Date",
  "Time",
  "Type",
  "Name",
  "Emoji",
  "Category",
  "Amount",
  "Currency",
  "Local amount",
  "Local currency",
  "Notes and #tags",
  "Address",
  "Receipt",
  "Description",
  "Category split",
  "Money Out",
  "Money In",
  "Balance",
  "Balance currency",
];

// Map CSV header strings to the keys of our transaction object.
const headerMap: Record<string, keyof MonzoTransaction> = {
  "Transaction ID": "transactionId",
  Date: "date",
  Time: "time",
  Type: "type",
  Name: "name",
  Emoji: "emoji",
  Category: "category",
  Amount: "amount",
  Currency: "currency",
  "Local amount": "localAmount",
  "Local currency": "localCurrency",
  "Notes and #tags": "notesAndTags",
  Address: "address",
  Receipt: "receipt",
  Description: "description",
  "Category split": "categorySplit",
  "Money Out": "moneyOut",
  "Money In": "moneyIn",
  Balance: "balance",
  "Balance currency": "balanceCurrency",
};

const areArraysIdentical = (arr1: string[], arr2: string[]): boolean => {
  if (arr1.length !== arr2.length) return false;
  return arr1.every((value, index) => {
    if (value !== arr2[index]) {
      console.log(
        `Header mismatch at position ${index}: Expected '${arr1[index]}', but got '${arr2[index]}'`,
      );
      return false;
    }
    return true;
  });
};

const buildNotes = (t: {
  notesAndTags: string;
  description: string;
  currency: string;
}): string => {
  const parts: string[] = [];

  if (t.notesAndTags.trim()) {
    parts.push(`Notes:\n${t.notesAndTags}`);
  }
  if (t.description.trim()) {
    parts.push(`Description:\n${t.description}`);
  }
  if (t.currency.trim()) {
    parts.push(`Currency:\n${t.currency}`);
  }

  return parts.join("\n\n"); // join with double line breaks for clarity
};

export const MonzoUpload = () => {
  /**
   * Callback passed to the UploadButton.
   * Processes CSVUploadResults by mapping each row into a MonzoTransaction.
   */
  const handleUploadAction = async (
    results: CSVUploadResults,
  ): Promise<void> => {
    if (results.errors.length > 0) {
      notifications.show({
        color: "red",
        title: "Error parsing CSV file.",
        message: "Please try again.",
      });
      return;
    }

    const allRows: string[][] = results.data;
    if (!allRows || allRows.length === 0) {
      notifications.show({
        color: "red",
        title: "No data found in the CSV file.",
        message: "Please try again.",
      });
      return;
    }

    // The first row is assumed to be the header row.
    const headerRow: string[] = allRows[0];

    if (!areArraysIdentical(expectedHeaders, headerRow)) {
      notifications.show({
        color: "red",
        title: "Header row does not match the expected...",
        message: "Please check if you are uploading correct file.",
      });
      return;
    }

    // Filter out empty rows.
    const dataRows: string[][] = allRows
      .slice(1)
      .filter(
        (row: string[]) =>
          row.length > 1 || (row.length === 1 && row[0].trim() !== ""),
      );

    // Convert each data row into a MonzoTransaction object.
    const parsedTransactions: MonzoTransaction[] = dataRows.map(
      (row: string[]) => {
        const tx: Partial<MonzoTransaction> = {};

        headerRow.forEach((header: string, index: number) => {
          const key = headerMap[header];
          if (key) {
            const rawValue = row[index] || "";
            if (isNumericKey(key)) {
              const parsedValue = parseFloat(rawValue);
              tx[key] = isNaN(parsedValue) ? 0 : parsedValue;
            } else {
              tx[key] = rawValue;
            }
          }
        });
        return tx as MonzoTransaction;
      },
    );

    const transactions: Transaction[] = parsedTransactions.map((t) => ({
      id: t.transactionId,
      name: t.name,
      notes: buildNotes({
        notesAndTags: t.notesAndTags,
        description: t.description,
        currency: t.currency,
      }),
      amount: t.amount,
      type: "BANK",
      orderId: null,
      customerId: null,
    }));

    createTransactions.mutate({ transactions });
  };

  const utils = trpc.useUtils();

  const createTransactions = trpc.transactions.createTransactions.useMutation({
    onSuccess: () => {
      notifications.show({
        color: "green",
        title: "Success!",
        message: "Transactions created!",
      });
      utils.transactions.getAll.invalidate();
      utils.transactions.getAllTransactionsWithAllocations.invalidate();
    },
    onError: () => {
      notifications.show({
        color: "red",
        title: "Failed to create Transactions",
        message: "Please try again.",
      });
    },
  });

  return <CsvUploadButton text="Monzo" onUploadAction={handleUploadAction} />;
};
