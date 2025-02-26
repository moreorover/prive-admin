// monzoCsvConfig.ts
import { Transaction } from "@/lib/schemas";
import dayjs from "dayjs";

import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

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

export const monzoExpectedHeaders: string[] = [
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

export const monzoHeaderMap: Record<string, keyof MonzoTransaction> = {
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

export const monzoNumericKeys: Array<keyof MonzoTransaction> = [
  "amount",
  "localAmount",
  "moneyOut",
  "moneyIn",
  "balance",
];

const buildMonzoNotes = (t: {
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
  return parts.join("\n\n");
};

export const monzoTransformRow = (t: MonzoTransaction): Transaction => ({
  id: t.transactionId,
  name: t.name,
  notes: buildMonzoNotes({
    notesAndTags: t.notesAndTags,
    description: t.description,
    currency: t.currency,
  }),
  amount: t.amount,
  type: "BANK",
  createdAt: dayjs(`${t.date} ${t.time}`, "DD/MM/YYYY HH:mm:ss").toDate(),
});
