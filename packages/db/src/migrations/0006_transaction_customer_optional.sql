ALTER TABLE "transaction" DROP CONSTRAINT "transaction_customer_id_customer_id_fk";
--> statement-breakpoint
ALTER TABLE "transaction" ALTER COLUMN "customer_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE set null ON UPDATE no action;