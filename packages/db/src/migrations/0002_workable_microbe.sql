-- Squashed migration: multi-legal-entity tenancy + bank statement staging.
-- Combines the original 0002..0009 sequence (LE/salon model, bank account &
-- statement entries, bill round-trip dropped, attachments table with nullable
-- entry FK, transaction.customer_id loosened to nullable).
--
-- Order is significant: new tables and seeds before backfill, backfill before
-- NOT NULL, NOT NULL before FK constraints.

CREATE TABLE "legal_entity" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"country" text NOT NULL,
	"default_currency" text NOT NULL,
	"registration_number" text,
	"vat_number" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "salon" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
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
CREATE TABLE "bank_statement_attachment" (
	"id" text PRIMARY KEY NOT NULL,
	"bank_statement_entry_id" text,
	"r2_key" text NOT NULL,
	"original_name" text NOT NULL,
	"content_type" text NOT NULL,
	"size" integer NOT NULL,
	"uploaded_by_id" text,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bank_statement_attachment_r2_key_unique" UNIQUE("r2_key")
);
--> statement-breakpoint

-- Seed legal entities (cuid2 IDs to match app-generated rows)
INSERT INTO "legal_entity" ("id","name","type","country","default_currency","created_at","updated_at")
VALUES
  ('dsozp1b55nr55ac1zka1znx6', 'Prive UK Ltd', 'LTD', 'GB', 'GBP', now(), now()),
  ('l5tn3uz35ngs42ulsniayw1u', 'Prive LT IV',  'IV',  'LT', 'EUR', now(), now()),
  ('s0c79bofwj9td8zq8metyb58', 'Prive LT MB',  'MB',  'LT', 'EUR', now(), now());
--> statement-breakpoint

-- Seed salons (cuid2 IDs)
INSERT INTO "salon" ("id","name","address","created_at","updated_at")
VALUES
  ('e6zm59ne62w8wzeqbr8bsbar', 'Prive UK', NULL, now(), now()),
  ('o5shsv4dktcez6d7g8efijv5', 'Prive LT', NULL, now(), now());
--> statement-breakpoint

-- Loosen transaction.customer_id to nullable + replace FK rule (set null instead of restrict)
ALTER TABLE "transaction" DROP CONSTRAINT "transaction_customer_id_customer_id_fk";--> statement-breakpoint
ALTER TABLE "transaction" ALTER COLUMN "customer_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint

-- Add new columns (nullable for backfill phase)
ALTER TABLE "appointment" ADD COLUMN "salon_id" text;--> statement-breakpoint
ALTER TABLE "hair_order" ADD COLUMN "legal_entity_id" text;--> statement-breakpoint
ALTER TABLE "transaction" ADD COLUMN "legal_entity_id" text;--> statement-breakpoint
ALTER TABLE "transaction" ADD COLUMN "bank_account_id" text;--> statement-breakpoint

-- Backfill: existing data attributed to Prive UK Ltd / Prive UK salon
UPDATE "appointment"
  SET "salon_id" = (SELECT id FROM "salon" WHERE name = 'Prive UK' LIMIT 1)
  WHERE "salon_id" IS NULL;
--> statement-breakpoint

UPDATE "transaction"
  SET "legal_entity_id" = (SELECT id FROM "legal_entity" WHERE type = 'LTD' AND country = 'GB' LIMIT 1)
  WHERE "legal_entity_id" IS NULL;
--> statement-breakpoint

UPDATE "hair_order"
  SET "legal_entity_id" = (SELECT id FROM "legal_entity" WHERE type = 'LTD' AND country = 'GB' LIMIT 1)
  WHERE "legal_entity_id" IS NULL;
--> statement-breakpoint

-- Verify zero NULL rows in scoped columns
DO $$
DECLARE missing INT;
BEGIN
  SELECT count(*) INTO missing FROM "appointment" WHERE "salon_id" IS NULL;
  IF missing > 0 THEN RAISE EXCEPTION 'appointment backfill incomplete: % rows', missing; END IF;
  SELECT count(*) INTO missing FROM "transaction" WHERE "legal_entity_id" IS NULL;
  IF missing > 0 THEN RAISE EXCEPTION 'transaction backfill incomplete: % rows', missing; END IF;
  SELECT count(*) INTO missing FROM "hair_order" WHERE "legal_entity_id" IS NULL;
  IF missing > 0 THEN RAISE EXCEPTION 'hair_order backfill incomplete: % rows', missing; END IF;
END $$;
--> statement-breakpoint

-- Tighten NOT NULL on backfilled columns
ALTER TABLE "appointment" ALTER COLUMN "salon_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "hair_order" ALTER COLUMN "legal_entity_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "transaction" ALTER COLUMN "legal_entity_id" SET NOT NULL;--> statement-breakpoint

-- Foreign keys
ALTER TABLE "bank_account" ADD CONSTRAINT "bank_account_legal_entity_id_legal_entity_id_fk" FOREIGN KEY ("legal_entity_id") REFERENCES "public"."legal_entity"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_statement_entry" ADD CONSTRAINT "bank_statement_entry_bank_account_id_bank_account_id_fk" FOREIGN KEY ("bank_account_id") REFERENCES "public"."bank_account"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_statement_entry" ADD CONSTRAINT "bank_statement_entry_linked_transaction_id_transaction_id_fk" FOREIGN KEY ("linked_transaction_id") REFERENCES "public"."transaction"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_statement_attachment" ADD CONSTRAINT "bank_statement_attachment_bank_statement_entry_id_bank_statement_entry_id_fk" FOREIGN KEY ("bank_statement_entry_id") REFERENCES "public"."bank_statement_entry"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_statement_attachment" ADD CONSTRAINT "bank_statement_attachment_uploaded_by_id_users_id_fk" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_salon_id_salon_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salon"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hair_order" ADD CONSTRAINT "hair_order_legal_entity_id_legal_entity_id_fk" FOREIGN KEY ("legal_entity_id") REFERENCES "public"."legal_entity"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_legal_entity_id_legal_entity_id_fk" FOREIGN KEY ("legal_entity_id") REFERENCES "public"."legal_entity"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_bank_account_id_bank_account_id_fk" FOREIGN KEY ("bank_account_id") REFERENCES "public"."bank_account"("id") ON DELETE set null ON UPDATE no action;
