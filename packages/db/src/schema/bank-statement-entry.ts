import { createId } from "@paralleldrive/cuid2"
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core"

import { bankAccount } from "./bank-account"
import { createdAt, updatedAt } from "./columns"

export const bankStatementEntry = sqliteTable(
  "bank_statement_entry",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    bankAccountId: text("bank_account_id")
      .notNull()
      .references(() => bankAccount.id, { onDelete: "restrict" }),
    externalRef: text("external_ref").notNull(), // transakcijos kodas
    docNumber: text("doc_number"),
    date: text("date").notNull(),
    amount: integer("amount").notNull(), // minor units
    currency: text("currency").notNull(),
    direction: text("direction").notNull(), // 'D' | 'C'
    counterpartyName: text("counterparty_name"),
    counterpartyIban: text("counterparty_iban"),
    counterpartyBank: text("counterparty_bank"),
    swift: text("swift"),
    purpose: text("purpose"),
    transactionType: text("transaction_type"),
    status: text("status").notNull().default("PENDING"), // 'PENDING' | 'IGNORED'
    importedAt: createdAt("imported_at"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex("bank_statement_entry_account_ref_unique").on(table.bankAccountId, table.externalRef),
    index("bank_statement_entry_bank_account_id_idx").on(table.bankAccountId),
    index("bank_statement_entry_date_idx").on(table.date),
  ],
)
