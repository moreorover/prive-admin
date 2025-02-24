"use client";

import React from "react";
import { Transaction } from "@/lib/schemas";
import { notifications } from "@mantine/notifications";
import { CsvUploadButton } from "@/modules/transactions/ui/components/csv-upload-button";
import { trpc } from "@/trpc/client";

// Define the type for CSV upload results.
interface CSVUploadResults {
  data: string[][];
  errors: string[];
  meta: unknown;
}

// Define the shape of a PayPal transaction.
export interface PayPalTransaction {
  date: string;
  time: string;
  timeZone: string;
  name: string;
  type: string;
  status: string;
  currency: string;
  gross: number;
  fee: number;
  net: number;
  fromEmail: string;
  toEmail: string;
  transactionId: string;
  shippingAddress: string;
  addressStatus: string;
  itemTitle: string;
  itemId: string;
  shippingHandling: number;
  insurance: number;
  salesTax: number;
  option1Name: string;
  option1Value: string;
  option2Name: string;
  option2Value: string;
  referenceTxnId: string;
  invoiceNumber: string;
  customNumber: string;
  quantity: number;
  receiptId: string;
  balance: number;
  addressLine1: string;
  addressLine2: string;
  townCity: string;
  stateProvince: string;
  zipPostalCode: string;
  country: string;
  contactPhone: string;
  subject: string;
  note: string;
  countryCode: string;
  balanceImpact: string;
}

// Define the keys that should be parsed as numbers.
type NumericKey =
  | "gross"
  | "fee"
  | "net"
  | "shippingHandling"
  | "insurance"
  | "salesTax"
  | "quantity"
  | "balance";

// Type guard to determine if a key is a NumericKey.
function isNumericKey(key: keyof PayPalTransaction): key is NumericKey {
  return [
    "gross",
    "fee",
    "net",
    "shippingHandling",
    "insurance",
    "salesTax",
    "quantity",
    "balance",
  ].includes(key);
}

const expectedHeaders = [
  "Date",
  "Time",
  "TimeZone",
  "Name",
  "Type",
  "Status",
  "Currency",
  "Gross",
  "Fee",
  "Net",
  "From Email Address",
  "To Email Address",
  "Transaction ID",
  "Shipping Address",
  "Address Status",
  "Item Title",
  "Item ID",
  "Shipping and Handling Amount",
  "Insurance Amount",
  "Sales Tax",
  "Option 1 Name",
  "Option 1 Value",
  "Option 2 Name",
  "Option 2 Value",
  "Reference Txn ID",
  "Invoice Number",
  "Custom Number",
  "Quantity",
  "Receipt ID",
  "Balance",
  "Address Line 1",
  "Address Line 2/District/Neighborhood",
  "Town/City",
  "State/Province/Region/County/Territory/Prefecture/Republic",
  "Zip/Postal Code",
  "Country",
  "Contact Phone Number",
  "Subject",
  "Note",
  "Country Code",
  "Balance Impact",
];

const headerMap: Record<string, keyof PayPalTransaction> = {
  Date: "date",
  Time: "time",
  TimeZone: "timeZone",
  Name: "name",
  Type: "type",
  Status: "status",
  Currency: "currency",
  Gross: "gross",
  Fee: "fee",
  Net: "net",
  "From Email Address": "fromEmail",
  "To Email Address": "toEmail",
  "Transaction ID": "transactionId",
  "Shipping Address": "shippingAddress",
  "Address Status": "addressStatus",
  "Item Title": "itemTitle",
  "Item ID": "itemId",
  "Shipping and Handling Amount": "shippingHandling",
  "Insurance Amount": "insurance",
  "Sales Tax": "salesTax",
  "Option 1 Name": "option1Name",
  "Option 1 Value": "option1Value",
  "Option 2 Name": "option2Name",
  "Option 2 Value": "option2Value",
  "Reference Txn ID": "referenceTxnId",
  "Invoice Number": "invoiceNumber",
  "Custom Number": "customNumber",
  Quantity: "quantity",
  "Receipt ID": "receiptId",
  Balance: "balance",
  "Address Line 1": "addressLine1",
  "Address Line 2/District/Neighborhood": "addressLine2",
  "Town/City": "townCity",
  "State/Province/Region/County/Territory/Prefecture/Republic": "stateProvince",
  "Zip/Postal Code": "zipPostalCode",
  Country: "country",
  "Contact Phone Number": "contactPhone",
  Subject: "subject",
  Note: "note",
  "Country Code": "countryCode",
  "Balance Impact": "balanceImpact",
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

const buildNotes = (transaction: PayPalTransaction): string => {
  const parts: string[] = [];

  if (transaction.type.trim()) {
    parts.push(`Type:\n${transaction.type}`);
  }
  if (transaction.fromEmail.trim()) {
    parts.push(`From Email Address:\n${transaction.fromEmail}`);
  }
  if (transaction.currency.trim()) {
    parts.push(`Currency:\n${transaction.currency}`);
  }
  if (transaction.itemTitle.trim()) {
    parts.push(`Item Title:\n${transaction.itemTitle}`);
  }
  if (transaction.subject.trim()) {
    parts.push(`Subject:\n${transaction.subject}`);
  }
  if (transaction.note.trim()) {
    parts.push(`Note:\n${transaction.note}`);
  }

  return parts.join("\n\n"); // join with double line breaks for clarity
};

export const PayPalUpload = () => {
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

    const headerRow: string[] = allRows[0];

    if (!areArraysIdentical(expectedHeaders, headerRow)) {
      notifications.show({
        color: "red",
        title: "Header row does not match the expected...",
        message: "Please check if you are uploading correct file.",
      });
      return;
    }

    const dataRows: string[][] = allRows
      .slice(1)
      .filter(
        (row) => row.length > 1 || (row.length === 1 && row[0].trim() !== ""),
      );

    const parsedTransactions: PayPalTransaction[] = dataRows
      .map((row: string[]) => {
        const tx: Partial<PayPalTransaction> = {};

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
        return tx as PayPalTransaction;
      })
      .filter((ppt) => ppt.status === "Completed")
      .filter((ppt) => ppt.type !== "General Card Deposit")
      .filter((ppt) => ppt.type !== "Reversal of General Account Hold")
      .filter((ppt) => ppt.type !== "User Initiated Withdrawal");

    const transactions: Transaction[] = parsedTransactions.map((t) => ({
      id: `pp_${t.transactionId}`,
      name: t.name,
      notes: buildNotes(t),
      amount: t.gross,
      type: "PAYPAL",
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

  return <CsvUploadButton text="PayPal" onUploadAction={handleUploadAction} />;
};
