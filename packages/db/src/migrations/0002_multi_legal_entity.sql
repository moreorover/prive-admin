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
	"country" text NOT NULL,
	"default_legal_entity_id" text NOT NULL,
	"address" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "appointment" ADD COLUMN "salon_id" text;--> statement-breakpoint
ALTER TABLE "appointment" ADD COLUMN "legal_entity_id" text;--> statement-breakpoint
ALTER TABLE "hair_order" ADD COLUMN "legal_entity_id" text;--> statement-breakpoint
ALTER TABLE "user_settings" ADD COLUMN "active_legal_entity_id" text;--> statement-breakpoint
ALTER TABLE "transaction" ADD COLUMN "legal_entity_id" text;--> statement-breakpoint
ALTER TABLE "salon" ADD CONSTRAINT "salon_default_legal_entity_id_legal_entity_id_fk" FOREIGN KEY ("default_legal_entity_id") REFERENCES "public"."legal_entity"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_salon_id_salon_id_fk" FOREIGN KEY ("salon_id") REFERENCES "public"."salon"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_legal_entity_id_legal_entity_id_fk" FOREIGN KEY ("legal_entity_id") REFERENCES "public"."legal_entity"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hair_order" ADD CONSTRAINT "hair_order_legal_entity_id_legal_entity_id_fk" FOREIGN KEY ("legal_entity_id") REFERENCES "public"."legal_entity"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_active_legal_entity_id_legal_entity_id_fk" FOREIGN KEY ("active_legal_entity_id") REFERENCES "public"."legal_entity"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_legal_entity_id_legal_entity_id_fk" FOREIGN KEY ("legal_entity_id") REFERENCES "public"."legal_entity"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint

-- Seed legal entities (cuid2 IDs to match app-generated rows)
INSERT INTO "legal_entity" ("id","name","type","country","default_currency","created_at","updated_at")
VALUES
  ('dsozp1b55nr55ac1zka1znx6', 'Prive UK Ltd', 'LTD', 'GB', 'GBP', now(), now()),
  ('l5tn3uz35ngs42ulsniayw1u', 'Prive LT IV',  'IV',  'LT', 'EUR', now(), now()),
  ('s0c79bofwj9td8zq8metyb58', 'Prive LT MB',  'MB',  'LT', 'EUR', now(), now());
--> statement-breakpoint

-- Seed salons (cuid2 IDs)
INSERT INTO "salon" ("id","name","country","default_legal_entity_id","created_at","updated_at")
VALUES
  ('e6zm59ne62w8wzeqbr8bsbar', 'Prive UK', 'GB', 'dsozp1b55nr55ac1zka1znx6', now(), now()),
  ('o5shsv4dktcez6d7g8efijv5', 'Prive LT', 'LT', 'l5tn3uz35ngs42ulsniayw1u', now(), now());
--> statement-breakpoint

-- Backfill appointment.salon_id and appointment.legal_entity_id
UPDATE "appointment"
SET "salon_id" = (SELECT id FROM "salon" WHERE name = 'Prive UK' AND country = 'GB' LIMIT 1),
    "legal_entity_id" = (SELECT id FROM "legal_entity" WHERE type = 'LTD' AND country = 'GB' LIMIT 1)
WHERE "salon_id" IS NULL OR "legal_entity_id" IS NULL;
--> statement-breakpoint

-- Backfill transaction.legal_entity_id
UPDATE "transaction"
SET "legal_entity_id" = (SELECT id FROM "legal_entity" WHERE type = 'LTD' AND country = 'GB' LIMIT 1)
WHERE "legal_entity_id" IS NULL;
--> statement-breakpoint

-- Backfill hair_order.legal_entity_id
UPDATE "hair_order"
SET "legal_entity_id" = (SELECT id FROM "legal_entity" WHERE type = 'LTD' AND country = 'GB' LIMIT 1)
WHERE "legal_entity_id" IS NULL;
--> statement-breakpoint

-- Verify zero NULL rows in scoped columns (raises if any remain)
DO $$
DECLARE missing INT;
BEGIN
  SELECT count(*) INTO missing FROM "appointment" WHERE "salon_id" IS NULL OR "legal_entity_id" IS NULL;
  IF missing > 0 THEN RAISE EXCEPTION 'appointment backfill incomplete: % rows', missing; END IF;
  SELECT count(*) INTO missing FROM "transaction" WHERE "legal_entity_id" IS NULL;
  IF missing > 0 THEN RAISE EXCEPTION 'transaction backfill incomplete: % rows', missing; END IF;
  SELECT count(*) INTO missing FROM "hair_order" WHERE "legal_entity_id" IS NULL;
  IF missing > 0 THEN RAISE EXCEPTION 'hair_order backfill incomplete: % rows', missing; END IF;
END $$;
--> statement-breakpoint

-- Tighten: NOT NULL on the four backfilled columns
ALTER TABLE "appointment" ALTER COLUMN "salon_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "appointment" ALTER COLUMN "legal_entity_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "transaction" ALTER COLUMN "legal_entity_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "hair_order" ALTER COLUMN "legal_entity_id" SET NOT NULL;--> statement-breakpoint

-- CHECK constraints
ALTER TABLE "legal_entity" ADD CONSTRAINT "legal_entity_type_chk" CHECK ("type" IN ('LTD','IV','MB'));--> statement-breakpoint
ALTER TABLE "legal_entity" ADD CONSTRAINT "legal_entity_country_chk" CHECK ("country" IN ('GB','LT'));--> statement-breakpoint
ALTER TABLE "salon" ADD CONSTRAINT "salon_country_chk" CHECK ("country" IN ('GB','LT'));--> statement-breakpoint

-- Indexes
CREATE INDEX "appointment_legal_entity_id_starts_at_idx" ON "appointment" ("legal_entity_id","starts_at");--> statement-breakpoint
CREATE INDEX "appointment_salon_id_starts_at_idx" ON "appointment" ("salon_id","starts_at");--> statement-breakpoint
CREATE INDEX "transaction_legal_entity_id_completed_date_by_idx" ON "transaction" ("legal_entity_id","completed_date_by");--> statement-breakpoint
CREATE INDEX "hair_order_legal_entity_id_placed_at_idx" ON "hair_order" ("legal_entity_id","placed_at");