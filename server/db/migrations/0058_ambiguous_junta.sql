ALTER TABLE "qr_codes" ADD COLUMN "canceled_at" timestamp;--> statement-breakpoint
ALTER TABLE "qr_codes" ADD COLUMN "canceled_by" text;--> statement-breakpoint
ALTER TABLE "qr_codes" ADD CONSTRAINT "qr_codes_canceled_by_user_id_fk" FOREIGN KEY ("canceled_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;