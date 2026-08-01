export const migratedTables = [
  "users",
  "accounts",
  "verifications",
  "customer",
  "legal_entity",
  "salon",
  "bank_account",
  "appointment",
  "appointment_personnel",
  "product",
  "product_variant",
  "order",
  "order_item",
  "hair_order",
  "hair_assigned",
  "transaction",
  "note",
  "cash_transaction",
  "bank_statement_entry",
  "bank_statement_attachment",
  "user_settings",
] as const

export const clearedTables = ["sessions", ...migratedTables] as const

export type MigratedTable = (typeof migratedTables)[number]
