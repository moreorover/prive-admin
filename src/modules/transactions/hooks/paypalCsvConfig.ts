// paypalCsvConfig.ts
import { Transaction } from "@/lib/schemas";
import dayjs from "dayjs";

import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

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

export const paypalExpectedHeaders: string[] = [
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

export const paypalHeaderMap: Record<string, keyof PayPalTransaction> = {
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

export const paypalNumericKeys: Array<keyof PayPalTransaction> = [
  "gross",
  "fee",
  "net",
  "shippingHandling",
  "insurance",
  "salesTax",
  "quantity",
  "balance",
];

const buildPaypalNotes = (t: PayPalTransaction): string => {
  const parts: string[] = [];
  if (t.type.trim()) {
    parts.push(`Type:\n${t.type}`);
  }
  if (t.fromEmail.trim()) {
    parts.push(`From Email Address:\n${t.fromEmail}`);
  }
  if (t.currency.trim()) {
    parts.push(`Currency:\n${t.currency}`);
  }
  if (t.itemTitle.trim()) {
    parts.push(`Item Title:\n${t.itemTitle}`);
  }
  if (t.subject.trim()) {
    parts.push(`Subject:\n${t.subject}`);
  }
  if (t.note.trim()) {
    parts.push(`Note:\n${t.note}`);
  }
  return parts.join("\n\n");
};

export const paypalTransformRow = (t: PayPalTransaction): Transaction => ({
  id: `pp_${t.transactionId}`,
  name: t.name,
  notes: buildPaypalNotes(t),
  amount: t.gross,
  type: "PAYPAL",
  createdAt: dayjs(`${t.date} ${t.time}`, "DD/MM/YYYY HH:mm:ss").toDate(),
});

export const paypalFilterRow = (t: PayPalTransaction): boolean =>
  t.status === "Completed" &&
  t.type !== "General Card Deposit" &&
  t.type !== "Reversal of General Account Hold" &&
  t.type !== "User Initiated Withdrawal";
