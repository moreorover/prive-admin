import { createId } from "@paralleldrive/cuid2"
import { pgTable, integer, text, timestamp, date, unique } from "drizzle-orm/pg-core"

import { bankAccount } from "./bank-account"
import { transaction } from "./transaction"

export const bankStatementEntry = pgTable(
  "bank_statement_entry",
  {
    id: text("id").primaryKey().$defaultFn(createId),
    bankAccountId: text("bank_account_id")
      .notNull()
      .references(() => bankAccount.id, { onDelete: "restrict" }),
    externalRef: text("external_ref").notNull(), // transakcijos kodas
    docNumber: text("doc_number"),
    date: date("date").notNull(),
    amount: integer("amount").notNull(), // minor units
    currency: text("currency").notNull(),
    direction: text("direction").notNull(), // 'D' | 'C'
    counterpartyName: text("counterparty_name"),
    counterpartyIban: text("counterparty_iban"),
    counterpartyBank: text("counterparty_bank"),
    swift: text("swift"),
    purpose: text("purpose"),
    transactionType: text("transaction_type"),
    status: text("status").notNull().default("PENDING"), // 'PENDING' | 'LINKED' | 'IGNORED'
    linkedTransactionId: text("linked_transaction_id").references(() => transaction.id, {
      onDelete: "set null",
    }),
    importedAt: timestamp("imported_at", { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [unique("bank_statement_entry_account_ref_unique").on(table.bankAccountId, table.externalRef)],
)
