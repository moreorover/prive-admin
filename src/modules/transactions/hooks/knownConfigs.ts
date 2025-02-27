// knownConfigs.ts
import { Transaction } from "@/lib/schemas";
import {
  MonzoTransaction,
  monzoExpectedHeaders,
  monzoHeaderMap,
  monzoNumericKeys,
  monzoTransformRow,
} from "./monzoCsvConfig";
import {
  PayPalTransaction,
  paypalExpectedHeaders,
  paypalHeaderMap,
  paypalNumericKeys,
  paypalFilterRow,
  paypalTransformRow,
} from "./paypalCsvConfig";

/**
 * CSV parser configuration interface now includes methods for parsing and filtering data.
 */
export interface CsvParserConfig<T> {
  name: string;
  expectedHeaders: string[];
  headerMap: Record<string, keyof T>;
  numericKeys: (keyof T)[];
  filterRow?: (row: T) => boolean;
  transformRow: (row: T) => Transaction;
  parseRows: (dataRows: string[][], headerRow: string[]) => T[];
  filterData: (rows: T[]) => T[];
}

/**
 * Helper function that parses a single CSV row into an object based on the provided configuration.
 */
function parseRow<T>(
  row: string[],
  headerRow: string[],
  config: Omit<CsvParserConfig<T>, "parseRows" | "filterData">,
): T {
  const parsed = {} as T;
  headerRow.forEach((header, index) => {
    const key = config.headerMap[header];
    if (key) {
      const rawValue = row[index] || "";
      if (config.numericKeys.includes(key)) {
        const num = parseFloat(rawValue);
        (parsed as Record<string, unknown>)[key as string] = isNaN(num)
          ? 0
          : num;
      } else {
        (parsed as Record<string, unknown>)[key as string] = rawValue;
      }
    }
  });
  return parsed;
}

/**
 * Factory function that creates a CsvParserConfig with default implementations for
 * parseRows and filterData.
 */
function createCsvParserConfig<T>(
  config: Omit<CsvParserConfig<T>, "parseRows" | "filterData">,
): CsvParserConfig<T> {
  return {
    ...config,
    parseRows: (dataRows: string[][], headerRow: string[]): T[] => {
      return dataRows.map((row) => parseRow<T>(row, headerRow, config));
    },
    filterData: (rows: T[]): T[] => {
      return config.filterRow
        ? rows.filter((row) => config.filterRow!(row))
        : rows;
    },
  };
}

/* ===== Monzo Configuration ===== */
export const monzoConfig: CsvParserConfig<MonzoTransaction> =
  createCsvParserConfig({
    name: "monzo",
    expectedHeaders: monzoExpectedHeaders,
    headerMap: monzoHeaderMap,
    numericKeys: monzoNumericKeys,
    transformRow: monzoTransformRow,
  });

/* ===== PayPal Configuration ===== */
export const paypalConfig: CsvParserConfig<PayPalTransaction> =
  createCsvParserConfig({
    name: "paypal",
    expectedHeaders: paypalExpectedHeaders,
    headerMap: paypalHeaderMap,
    numericKeys: paypalNumericKeys,
    filterRow: paypalFilterRow,
    transformRow: paypalTransformRow,
  });

/**
 * Export an array of all known CSV configurations.
 */
export const knownConfigs: Array<
  CsvParserConfig<MonzoTransaction> | CsvParserConfig<PayPalTransaction>
> = [monzoConfig, paypalConfig];

export const parseAndTransformTransactions = <
  T extends MonzoTransaction | PayPalTransaction,
>(
  config: CsvParserConfig<T>,
  dataRows: string[][],
  headerRow: string[],
): Transaction[] => {
  const parsedRows = config.parseRows(dataRows, headerRow);
  const filteredRows = config.filterData(parsedRows);
  return filteredRows.map(config.transformRow);
};
