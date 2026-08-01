import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vite-plus/test"

import { cashTransaction } from "./schema/cash-transaction"

const migrationSql = readFileSync(
  fileURLToPath(new URL("./migrations/0000_melodic_major_mapleleaf.sql", import.meta.url).href),
  "utf8",
)

describe("cashTransaction schema", () => {
  it("uses a required restricted customer relation and required creator relation", () => {
    expect(cashTransaction.customerId.notNull).toBe(true)
    expect(cashTransaction.createdById.notNull).toBe(true)
    expect(migrationSql).toMatch(
      /FOREIGN KEY \(`customer_id`\) REFERENCES `customer`\(`id`\) ON UPDATE no action ON DELETE restrict/,
    )
    expect(migrationSql).toMatch(
      /FOREIGN KEY \(`created_by_id`\) REFERENCES `users`\(`id`\) ON UPDATE no action ON DELETE restrict/,
    )
  })

  it("stores signed integer amounts", () => {
    expect(cashTransaction.amount.notNull).toBe(true)
    expect(cashTransaction.amount.dataType).toBe("number")
    expect(cashTransaction.amount.columnType).toBe("SQLiteInteger")
    expect(cashTransaction.amount.getSQLType()).toBe("integer")
  })

  it("stores createdAt as an integer timestamp while the UI collects only dates", () => {
    expect(cashTransaction.createdAt.notNull).toBe(true)
    expect(cashTransaction.createdAt.dataType).toBe("date")
    expect(cashTransaction.createdAt.columnType).toBe("SQLiteTimestamp")
    expect(cashTransaction.createdAt.getSQLType()).toBe("integer")
    expect(migrationSql).toContain("`created_at` integer NOT NULL")
  })

  it("defaults to EUR currency and requires updatedAt timestamps", () => {
    expect(cashTransaction.currency.notNull).toBe(true)
    expect(cashTransaction.currency.default).toBe("EUR")
    expect(cashTransaction.updatedAt.notNull).toBe(true)
    expect(cashTransaction.updatedAt.columnType).toBe("SQLiteTimestamp")
    expect(cashTransaction.updatedAt.getSQLType()).toBe("integer")
  })

  it("indexes list access patterns", () => {
    expect(migrationSql).toContain(
      "CREATE INDEX `cash_transaction_created_at_id_idx` ON `cash_transaction` (`created_at`,`id`);",
    )
    expect(migrationSql).toContain(
      "CREATE INDEX `cash_transaction_customer_id_idx` ON `cash_transaction` (`customer_id`);",
    )
    expect(migrationSql).toContain(
      "CREATE INDEX `cash_transaction_currency_created_at_idx` ON `cash_transaction` (`currency`,`created_at`);",
    )
  })
})
