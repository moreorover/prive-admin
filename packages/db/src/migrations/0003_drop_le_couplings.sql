ALTER TABLE "appointment" DROP CONSTRAINT "appointment_legal_entity_id_legal_entity_id_fk";
--> statement-breakpoint
ALTER TABLE "user_settings" DROP CONSTRAINT "user_settings_active_legal_entity_id_legal_entity_id_fk";
--> statement-breakpoint
ALTER TABLE "salon" DROP CONSTRAINT "salon_default_legal_entity_id_legal_entity_id_fk";
--> statement-breakpoint
ALTER TABLE "appointment" DROP COLUMN "legal_entity_id";--> statement-breakpoint
ALTER TABLE "user_settings" DROP COLUMN "active_legal_entity_id";--> statement-breakpoint
ALTER TABLE "salon" DROP COLUMN "country";--> statement-breakpoint
ALTER TABLE "salon" DROP COLUMN "default_legal_entity_id";--> statement-breakpoint
ALTER TABLE "salon" DROP CONSTRAINT IF EXISTS "salon_country_chk";