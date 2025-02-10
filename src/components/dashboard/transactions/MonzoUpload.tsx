"use client";

import React from "react";
import { UploadButton } from "./UploadButton";
import { Transaction } from "@/lib/schemas";
import { createTransactions } from "@/data-access/transaction";
import { notifications } from "@mantine/notifications"; // adjust the import path as needed

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

export const MonzoUpload = () => {
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
      amount: t.amount * 100,
      type: "BANK",
      orderId: null,
      customerId: null,
    }));

    const response = await createTransactions(transactions);

    if (response.type === "ERROR") {
      notifications.show({
        color: "red",
        title: "Failed to create Transactions",
        message: response.message,
      });
    } else {
      notifications.show({
        color: "green",
        title: "Success!",
        message: response.message,
      });
    }
  };

  return <UploadButton text="Monzo" onUploadAction={handleUploadAction} />;
};
