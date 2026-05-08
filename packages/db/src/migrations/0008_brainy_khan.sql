CREATE TABLE "bank_statement_attachment" (
	"id" text PRIMARY KEY NOT NULL,
	"bank_statement_entry_id" text NOT NULL,
	"r2_key" text NOT NULL,
	"original_name" text NOT NULL,
	"content_type" text NOT NULL,
	"size" integer NOT NULL,
	"uploaded_by_id" text,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bank_statement_attachment_r2_key_unique" UNIQUE("r2_key")
);
--> statement-breakpoint
ALTER TABLE "bank_statement_attachment" ADD CONSTRAINT "bank_statement_attachment_bank_statement_entry_id_bank_statement_entry_id_fk" FOREIGN KEY ("bank_statement_entry_id") REFERENCES "public"."bank_statement_entry"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_statement_attachment" ADD CONSTRAINT "bank_statement_attachment_uploaded_by_id_users_id_fk" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;