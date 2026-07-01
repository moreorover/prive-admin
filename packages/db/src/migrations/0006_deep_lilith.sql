ALTER TABLE "appointment" DROP CONSTRAINT "appointment_master_id_customer_id_fk";
--> statement-breakpoint
ALTER TABLE "appointment" ALTER COLUMN "master_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_master_id_customer_id_fk" FOREIGN KEY ("master_id") REFERENCES "public"."customer"("id") ON DELETE restrict ON UPDATE no action;