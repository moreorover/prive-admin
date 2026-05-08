ALTER TABLE "bill" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "bill" CASCADE;--> statement-breakpoint
ALTER TABLE "transaction" DROP CONSTRAINT "transaction_bill_id_bill_id_fk";
--> statement-breakpoint
ALTER TABLE "transaction" DROP COLUMN "bill_id";