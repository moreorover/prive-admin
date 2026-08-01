ALTER TABLE "hair_assigned" ADD COLUMN "sold_at" timestamp with time zone;
--> statement-breakpoint
UPDATE "hair_assigned"
SET "sold_at" = coalesce("appointment"."starts_at", "hair_assigned"."created_at")
FROM "appointment"
WHERE "hair_assigned"."appointment_id" = "appointment"."id";
--> statement-breakpoint
UPDATE "hair_assigned"
SET "sold_at" = "created_at"
WHERE "sold_at" IS NULL;
--> statement-breakpoint
ALTER TABLE "hair_assigned" ALTER COLUMN "sold_at" SET DEFAULT now();
--> statement-breakpoint
ALTER TABLE "hair_assigned" ALTER COLUMN "sold_at" SET NOT NULL;
