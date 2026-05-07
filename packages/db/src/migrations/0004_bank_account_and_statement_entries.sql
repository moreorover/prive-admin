CREATE TABLE "bank_account" (
	"id" text PRIMARY KEY NOT NULL,
	"legal_entity_id" text NOT NULL,
	"iban" text NOT NULL,
	"currency" text NOT NULL,
	"bank_name" text,
	"swift" text,
	"display_name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "bank_account_iban_unique" UNIQUE("iban")
);
--> statement-breakpoint
CREATE TABLE "bank_statement_entry" (
	"id" text PRIMARY KEY NOT NULL,
	"bank_account_id" text NOT NULL,
	"external_ref" text NOT NULL,
	"doc_number" text,
	"date" date NOT NULL,
	"amount" integer NOT NULL,
	"currency" text NOT NULL,
	"direction" text NOT NULL,
	"counterparty_name" text,
	"counterparty_iban" text,
	"counterparty_bank" text,
	"swift" text,
	"purpose" text,
	"transaction_type" text,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"linked_transaction_id" text,
	"imported_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "bank_statement_entry_account_ref_unique" UNIQUE("bank_account_id","external_ref")
);
--> statement-breakpoint
ALTER TABLE "transaction" ADD COLUMN "bank_account_id" text;--> statement-breakpoint
ALTER TABLE "bank_account" ADD CONSTRAINT "bank_account_legal_entity_id_legal_entity_id_fk" FOREIGN KEY ("legal_entity_id") REFERENCES "public"."legal_entity"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_statement_entry" ADD CONSTRAINT "bank_statement_entry_bank_account_id_bank_account_id_fk" FOREIGN KEY ("bank_account_id") REFERENCES "public"."bank_account"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_statement_entry" ADD CONSTRAINT "bank_statement_entry_linked_transaction_id_transaction_id_fk" FOREIGN KEY ("linked_transaction_id") REFERENCES "public"."transaction"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_bank_account_id_bank_account_id_fk" FOREIGN KEY ("bank_account_id") REFERENCES "public"."bank_account"("id") ON DELETE set null ON UPDATE no action;