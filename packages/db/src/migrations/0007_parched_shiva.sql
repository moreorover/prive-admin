CREATE TABLE "cash_transaction" (
	"id" text PRIMARY KEY NOT NULL,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'EUR' NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"description" text,
	"notes" text,
	"customer_id" text NOT NULL,
	"created_by_id" text NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cash_transaction" ADD CONSTRAINT "cash_transaction_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cash_transaction" ADD CONSTRAINT "cash_transaction_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "cash_transaction_created_at_id_idx" ON "cash_transaction" USING btree ("created_at","id");--> statement-breakpoint
CREATE INDEX "cash_transaction_customer_id_idx" ON "cash_transaction" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "cash_transaction_currency_created_at_idx" ON "cash_transaction" USING btree ("currency","created_at");
