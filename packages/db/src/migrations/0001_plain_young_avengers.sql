CREATE TABLE "user_settings" (
	"user_id" text PRIMARY KEY NOT NULL,
	"preferred_currency" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "transaction" ADD COLUMN "currency" text;--> statement-breakpoint
UPDATE "transaction" SET "currency" = 'GBP' WHERE "currency" IS NULL;--> statement-breakpoint
ALTER TABLE "transaction" ALTER COLUMN "currency" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;