DELETE FROM "bank_statement_entry" WHERE "status" = 'LINKED' OR "linked_transaction_id" IS NOT NULL;
--> statement-breakpoint
ALTER TABLE "bank_statement_entry" DROP CONSTRAINT "bank_statement_entry_linked_transaction_id_transaction_id_fk";
--> statement-breakpoint
ALTER TABLE "transaction" DROP CONSTRAINT "transaction_legal_entity_id_legal_entity_id_fk";
--> statement-breakpoint
ALTER TABLE "transaction" DROP CONSTRAINT "transaction_bank_account_id_bank_account_id_fk";
--> statement-breakpoint
ALTER TABLE "bank_statement_entry" DROP COLUMN "linked_transaction_id";--> statement-breakpoint
ALTER TABLE "transaction" DROP COLUMN "type";--> statement-breakpoint
ALTER TABLE "transaction" DROP COLUMN "status";--> statement-breakpoint
ALTER TABLE "transaction" DROP COLUMN "completed_date_by";--> statement-breakpoint
ALTER TABLE "transaction" DROP COLUMN "legal_entity_id";--> statement-breakpoint
ALTER TABLE "transaction" DROP COLUMN "bank_account_id";
